package main

import (
	"context"
	"encoding/json"
	"github.com/joho/godotenv"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Opt-in read-only business checks on the installed store. Credentials are never logged.
func TestExistingStore(t *testing.T) {
	password := os.Getenv("DONPEPE_VERIFY_PASSWORD")
	if password == "" {
		t.Skip("Comprobación de instalación existente no solicitada")
	}
	root, err := filepath.Abs("..")
	if err != nil {
		t.Fatal(err)
	}
	config, err := godotenv.Read(filepath.Join(root, ".env"))
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if err = ensureLocalDatabase(ctx, root, config["DATABASE_URL"]); err != nil {
		t.Fatal(err)
	}
	db, err := openDatabase(config["DATABASE_URL"])
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	snapshot := func() map[string]string {
		result := map[string]string{}
		for _, table := range []string{"User", "Product", "Customer", "Sale", "SaleItem", "StockMovement", "StoreSetting"} {
			var value string
			if err := db.QueryRow(`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb)::text FROM "` + table + `" t`).Scan(&value); err != nil {
				t.Fatal(err)
			}
			result[table] = value
		}
		return result
	}
	before := snapshot()
	if before["User"] == "[]" {
		t.Skip("La comprobación requiere una tienda ya configurada")
	}
	if err = migrateDatabase(ctx, db); err != nil {
		t.Fatal(err)
	}
	if err = seedEmptyDatabase(ctx, db, root, "Not-A-Password-Reset"); err != nil {
		t.Fatal(err)
	}
	handler := (&server{db: db, root: root, images: filepath.Join(root, ".runtime", "product-images"), secret: config["JWT_SECRET"], attempts: map[string]attempt{}}).handler()
	body, _ := json.Marshal(object{"email": "admin@donpepe.local", "password": password})
	response := httptest.NewRecorder()
	request := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(string(body)))
	request.Header.Set("Content-Type", "application/json")
	handler.ServeHTTP(response, request)
	if response.Code != 201 {
		t.Fatalf("No se pudo autenticar la cuenta existente: HTTP %d", response.Code)
	}
	cookie := strings.Split(response.Header().Get("Set-Cookie"), ";")[0]
	for _, route := range []string{"auth/me", "products", "customers", "sales", "dashboard", "settings", "users"} {
		response := httptest.NewRecorder()
		request := httptest.NewRequest("GET", "/api/"+route, nil)
		request.Header.Set("Cookie", cookie)
		handler.ServeHTTP(response, request)
		if response.Code != 200 {
			t.Fatalf("%s: HTTP %d", route, response.Code)
		}
	}
	after := snapshot()
	for table, value := range before {
		if after[table] != value {
			t.Fatalf("Se modificaron registros de %s", table)
		}
	}
}
