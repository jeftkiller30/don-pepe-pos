package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"testing"
)

// This suite owns a separate PostgreSQL cluster; it never connects to store data.
func TestIntegration(t *testing.T) {
	if os.Getenv("DONPEPE_INTEGRATION") != "1" {
		t.Skip("Activa DONPEPE_INTEGRATION=1 para probar con PostgreSQL real")
	}
	if runtime.GOOS != "windows" {
		t.Skip("El clúster temporal de esta entrega usa PostgreSQL de Windows")
	}
	root, err := filepath.Abs("..")
	if err != nil {
		t.Fatal(err)
	}
	base := filepath.Join(root, ".runtime")
	if err = os.MkdirAll(base, 0700); err != nil {
		t.Fatal(err)
	}
	dir, err := os.MkdirTemp(base, "go-test-")
	if err != nil {
		t.Fatal(err)
	}
	bin := os.Getenv("POSTGRES_BIN")
	if bin == "" {
		bin = `C:\Program Files\PostgreSQL\17\bin`
	}
	password := "Test-" + id()
	pw := filepath.Join(dir, "password")
	if err = os.WriteFile(pw, []byte(password), 0600); err != nil {
		t.Fatal(err)
	}
	defer os.Remove(pw)
	ctx := context.Background()
	if err = postgresCommand(ctx, filepath.Join(bin, "initdb.exe"), "-D", filepath.Join(dir, "data"), "-U", "tester", "-A", "scram-sha-256", "--pwfile", pw, "--encoding=UTF8", "--locale=C", "--no-sync"); err != nil {
		t.Fatal(err)
	}
	portProbe, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := portProbe.Addr().(*net.TCPAddr).Port
	portProbe.Close()
	control := filepath.Join(bin, "pg_ctl.exe")
	if err = postgresCommand(ctx, control, "-D", filepath.Join(dir, "data"), "-l", filepath.Join(dir, "postgres.log"), "-o", fmt.Sprintf("-p %d -h 127.0.0.1", port), "-w", "start"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := postgresCommand(context.Background(), control, "-D", filepath.Join(dir, "data"), "-m", "fast", "-w", "stop"); err != nil {
			t.Error(err)
		}
	})
	raw := (&url.URL{Scheme: "postgresql", User: url.UserPassword("tester", password), Host: net.JoinHostPort("127.0.0.1", strconv.Itoa(port)), Path: "/postgres"}).String()
	db, err := openDatabase(raw)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	if err = migrateDatabase(ctx, db); err != nil {
		t.Fatal(err)
	}
	if err = migrateDatabase(ctx, db); err != nil {
		t.Fatal(err)
	}
	execSQL := func(query string, args ...any) {
		t.Helper()
		if _, err := db.Exec(query, args...); err != nil {
			t.Fatal(err)
		}
	}
	for _, role := range []string{"ADMIN", "CASHIER", "INVENTORY"} {
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), 4)
		execSQL(`INSERT INTO "User"(id,name,email,password,role) VALUES($1,$2,$3,$4,$5)`, id(), role, strings.ToLower(role)+"@tests.local", string(hash), role)
	}
	execSQL(`INSERT INTO "StoreSetting"(id) VALUES(1)`)
	s := &server{db: db, root: root, images: filepath.Join(dir, "images"), secret: strings.Repeat("s", 48), attempts: map[string]attempt{}}
	os.MkdirAll(s.images, 0700)
	handler := s.handler()
	call := func(route, method string, body any, cookie string) *httptest.ResponseRecorder {
		var data []byte
		if body != nil {
			data, _ = json.Marshal(body)
		}
		request := httptest.NewRequest(method, "http://127.0.0.1:3000/api/"+route, bytes.NewReader(data))
		request.RemoteAddr = "127.0.0.1:1234"
		if body != nil {
			request.Header.Set("Content-Type", "application/json")
		}
		if cookie != "" {
			request.Header.Set("Cookie", cookie)
		}
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		return response
	}
	check := func(response *httptest.ResponseRecorder, status int) object {
		t.Helper()
		if response.Code != status {
			t.Fatalf("HTTP %d, esperado %d: %s", response.Code, status, response.Body.String())
		}
		var data object
		_ = json.Unmarshal(response.Body.Bytes(), &data)
		return data
	}
	login := func(role string) string {
		response := call("auth/login", "POST", object{"email": role + "@tests.local", "password": password}, "")
		check(response, 201)
		return strings.Split(response.Header().Get("Set-Cookie"), ";")[0]
	}
	admin, cashier, inventory := login("admin"), login("cashier"), login("inventory")
	var product, customer, sale object
	productBody := object{"sku": "TEST01", "name": "Producto de prueba", "category": "Pruebas", "price": 100, "minStock": 2, "image": "snack"}
	stock := func() int64 {
		var value int64
		if err := db.QueryRow(`SELECT stock FROM "Product" WHERE id=$1`, product["id"]).Scan(&value); err != nil {
			t.Fatal(err)
		}
		return value
	}
	saleBody := func() object {
		return object{"requestId": id(), "items": []object{{"productId": product["id"], "quantity": 2}}, "payment": "CASH", "received": 500, "discount": 0}
	}
	parent := t
	step := func(name string, fn func()) {
		if !parent.Run(name, func(child *testing.T) { previous := t; t = child; defer func() { t = previous }(); fn() }) {
			parent.FailNow()
		}
	}
	step("autenticacion_y_origen", func() {
		check(call("products", "GET", nil, ""), 401)
		request := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader("{}"))
		request.Header.Set("Origin", "https://evil.example")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		check(response, 403)
	})
	step("producto_y_precio_fijo", func() {
		product = check(call("products", "POST", productBody, admin), 201)
		check(call("products", "POST", productBody, admin), 409)
		invalid := object{"sku": "INVALID", "name": "Inválido", "category": "Pruebas", "price": 200, "minStock": 2, "image": "snack"}
		check(call("products", "POST", invalid, admin), 400)
		invalid["price"] = 100
		invalid["stock"] = 999
		check(call("products", "POST", invalid, admin), 400)
	})
	step("fotografias", func() {
		photo, err := os.ReadFile(filepath.Join(root, "frontend", "public", "assets", "products", "inca-kola.jpg"))
		if err != nil {
			t.Fatal(err)
		}
		upload := func(data []byte, cookie, kind string) *httptest.ResponseRecorder {
			req := httptest.NewRequest("POST", "/api/product-images", bytes.NewReader(data))
			req.Header.Set("Content-Type", kind)
			req.Header.Set("Cookie", cookie)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			return rec
		}
		check(upload(photo, cashier, "image/jpeg"), 403)
		check(upload([]byte("invalid"), admin, "image/jpeg"), 400)
		check(upload(make([]byte, 5*1024*1024+1), admin, "image/jpeg"), 413)
		image := check(upload(photo, inventory, "image/jpeg"), 201)["image"].(string)
		got := call("product-images/"+image, "GET", nil, "")
		if got.Code != 200 || !bytes.Equal(got.Body.Bytes(), photo) {
			t.Fatal("La fotografía no coincide")
		}
		productBody["image"] = image
		check(call("products/"+text(product, "id"), "PATCH", productBody, admin), 200)
	})
	step("roles_y_stock", func() {
		check(call("products", "POST", productBody, cashier), 403)
		check(call("products/"+text(product, "id")+"/stock", "POST", object{"quantity": 10, "reason": "Inventario inicial"}, inventory), 201)
		check(call("products/"+text(product, "id")+"/stock", "POST", object{"quantity": -99, "reason": "Retiro inválido"}, admin), 409)
		if stock() != 10 {
			t.Fatal("Stock alterado")
		}
		check(call("products/"+text(product, "id")+"/movements", "GET", nil, admin), 200)
	})
	step("clientes", func() {
		customer = check(call("customers", "POST", object{"name": "Cliente Prueba", "document": "12345678", "phone": "", "email": ""}, admin), 201)
		check(call("customers/"+text(customer, "id"), "PATCH", object{"name": "Cliente Editado", "document": "12345678", "phone": "999", "email": ""}, cashier), 200)
	})
	step("pagos_invalidos", func() {
		body := saleBody()
		body["received"] = 1
		check(call("sales", "POST", body, admin), 400)
		if stock() != 10 {
			t.Fatal("Un pago inválido cambió stock")
		}
	})
	step("venta_y_reintento", func() {
		body := saleBody()
		body["customerId"] = customer["id"]
		body["discount"] = 25
		sale = check(call("sales", "POST", body, admin), 201)
		if number(sale, "total") != 175 || number(sale, "change") != 325 || text(sale, "customerName") != "Cliente Editado" {
			t.Fatal("Importes o cliente incorrectos")
		}
		duplicate := check(call("sales", "POST", body, admin), 201)
		if duplicate["id"] != sale["id"] || stock() != 8 {
			t.Fatal("Venta duplicada")
		}
	})
	concurrent := func(body object) []int {
		codes := make([]int, 2)
		var wg sync.WaitGroup
		for i := range codes {
			wg.Add(1)
			go func(i int) { defer wg.Done(); codes[i] = call("sales", "POST", body, admin).Code }(i)
		}
		wg.Wait()
		sort.Ints(codes)
		return codes
	}
	step("reintentos_simultaneos", func() {
		codes := concurrent(saleBody())
		if codes[0] != 201 || codes[1] != 201 || stock() != 6 {
			t.Fatalf("Reintentos incorrectos: %v, stock %d", codes, stock())
		}
	})
	step("sin_sobreventa", func() {
		codes := make([]int, 2)
		var wg sync.WaitGroup
		for i := range codes {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				body := saleBody()
				body["items"] = []object{{"productId": product["id"], "quantity": 5}}
				codes[i] = call("sales", "POST", body, admin).Code
			}(i)
		}
		wg.Wait()
		sort.Ints(codes)
		if codes[0] != 201 || codes[1] != 409 || stock() != 1 {
			t.Fatalf("Sobreventa: %v", codes)
		}
	})
	sid := func() string { return strconv.FormatInt(number(sale, "id"), 10) }
	step("permisos_venta", func() {
		body := saleBody()
		body["discount"] = 1
		check(call("sales", "POST", body, cashier), 403)
		check(call("sales", "POST", saleBody(), inventory), 403)
		check(call("sales/"+sid()+"/cancel", "POST", object{"reason": "Sin permiso"}, cashier), 403)
	})
	step("anulacion_una_vez", func() {
		var wg sync.WaitGroup
		codes := make([]int, 2)
		for i := range codes {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				codes[i] = call("sales/"+sid()+"/cancel", "POST", object{"reason": "Anulación de prueba"}, admin).Code
			}(i)
		}
		wg.Wait()
		sort.Ints(codes)
		if codes[0] != 201 || codes[1] != 409 || stock() != 3 {
			t.Fatalf("Anulación incorrecta: %v", codes)
		}
	})
	step("reportes_y_fechas", func() {
		report := check(call("dashboard", "GET", nil, admin), 200)
		if number(report, "tickets") != 2 || number(report, "units") != 7 || number(report, "revenue") != 700 {
			t.Fatalf("Reporte incorrecto: %v", report)
		}
		check(call("sales?from=2026-02-31&to=2026-03-05", "GET", nil, admin), 400)
		check(call("sales/invalid", "GET", nil, admin), 400)
	})
	step("archivo_conserva_historial", func() {
		check(call("products/"+text(product, "id"), "DELETE", nil, admin), 200)
		check(call("sales", "POST", saleBody(), admin), 409)
		check(call("sales/"+sid(), "GET", nil, admin), 200)
		check(call("customers/"+text(customer, "id"), "DELETE", nil, admin), 200)
	})
	step("usuarios_configuracion_contrasena", func() {
		check(call("settings", "PATCH", object{"name": "Tienda Test", "address": "Dirección Test", "phone": "123", "receiptMessage": "Gracias"}, admin), 200)
		newUser := check(call("users", "POST", object{"name": "Nuevo", "email": "new@tests.local", "password": password, "role": "CASHIER"}, admin), 201)
		if newUser["password"] != nil {
			t.Fatal("Hash expuesto")
		}
		session := login("new")
		check(call("auth/password", "PATCH", object{"currentPassword": password, "newPassword": password + "x"}, session), 200)
		check(call("auth/login", "POST", object{"email": "new@tests.local", "password": password}, ""), 401)
		check(call("users/"+text(newUser, "id"), "PATCH", object{"active": false}, admin), 200)
		check(call("auth/me", "GET", nil, session), 401)
	})
	step("cierre_sesion", func() {
		rec := call("auth/logout", "POST", nil, admin)
		check(rec, 201)
		if !strings.HasPrefix(rec.Header().Get("Set-Cookie"), "dp_session=;") {
			t.Fatal("Cookie no eliminada")
		}
	})
	step("migraciones_previas", func() {
		var before, after string
		db.QueryRow(`SELECT jsonb_agg(to_jsonb(u) ORDER BY id)::text FROM "User" u`).Scan(&before)
		execSQL(`CREATE TABLE "_prisma_migrations"(migration_name TEXT,finished_at TIMESTAMP,rolled_back_at TIMESTAMP)`)
		entries, _ := migrationFiles.ReadDir("migrations")
		for _, entry := range entries {
			execSQL(`INSERT INTO "_prisma_migrations" VALUES($1,now(),NULL)`, entry.Name())
		}
		execSQL(`DELETE FROM "_donpepe_go_migrations"`)
		if err := migrateDatabase(ctx, db); err != nil {
			t.Fatal(err)
		}
		db.QueryRow(`SELECT jsonb_agg(to_jsonb(u) ORDER BY id)::text FROM "User" u`).Scan(&after)
		if before != after {
			t.Fatal("Migración modificó usuarios")
		}
	})
	step("base_nueva_y_contrasena_existente", func() {
		otherURL, _ := url.Parse(raw)
		q := otherURL.Query()
		q.Set("schema", "seed_test")
		otherURL.RawQuery = q.Encode()
		other, err := openDatabase(otherURL.String())
		if err != nil {
			t.Fatal(err)
		}
		defer other.Close()
		if err = migrateDatabase(ctx, other); err != nil {
			t.Fatal(err)
		}
		if err = seedEmptyDatabase(ctx, other, root, password); err != nil {
			t.Fatal(err)
		}
		var hash string
		var products int
		other.QueryRow(`SELECT password FROM "User"`).Scan(&hash)
		other.QueryRow(`SELECT count(*) FROM "Product"`).Scan(&products)
		if products != 12 || bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
			t.Fatal("Preparación inicial incorrecta")
		}
		if err = seedEmptyDatabase(ctx, other, root, password+"changed"); err != nil {
			t.Fatal(err)
		}
		var after string
		other.QueryRow(`SELECT password FROM "User"`).Scan(&after)
		if hash != after {
			t.Fatal("Se restableció una contraseña existente")
		}
	})
	step("frontend_compilado", func() {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/inventario", nil))
		if rec.Code != 200 || !strings.Contains(rec.Body.String(), "/assets/index-") {
			t.Fatal("Go no entrega React compilado")
		}
	})
}
