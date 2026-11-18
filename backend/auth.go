package main

import (
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"strings"
	"time"
)

func (s *server) register(m *http.ServeMux) {
	admin := []string{"ADMIN"}
	stock := []string{"ADMIN", "INVENTORY"}
	sell := []string{"ADMIN", "CASHIER"}
	s.route(m, "GET /api/health", true, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		e := s.db.PingContext(r.Context())
		return object{"status": "ok", "database": "PostgreSQL", "backend": "Go"}, e
	})
	s.route(m, "POST /api/auth/login", true, nil, s.login)
	s.route(m, "GET /api/auth/me", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) { return user(r), nil })
	s.route(m, "POST /api/auth/logout", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		http.SetCookie(w, &http.Cookie{Name: "dp_session", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteStrictMode, Secure: s.secure})
		return object{"ok": true}, nil
	})
	s.route(m, "PATCH /api/auth/password", false, nil, s.password)
	s.route(m, "GET /api/products", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return list(r.Context(), s.db, `SELECT to_jsonb(p) FROM "Product" p WHERE active ORDER BY name`)
	})
	s.route(m, "POST /api/products", false, stock, s.saveProduct)
	s.route(m, "PATCH /api/products/{id}", false, stock, s.saveProduct)
	s.route(m, "DELETE /api/products/{id}", false, stock, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return one(r.Context(), s.db, `UPDATE "Product" p SET active=false,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$1 RETURNING to_jsonb(p)`, r.PathValue("id"))
	})
	s.route(m, "POST /api/products/{id}/stock", false, stock, s.stock)
	s.route(m, "GET /api/products/{id}/movements", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return list(r.Context(), s.db, `SELECT to_jsonb(m)||jsonb_build_object('user',jsonb_build_object('name',u.name)) FROM "StockMovement" m JOIN "User" u ON u.id=m."userId" WHERE m."productId"=$1 ORDER BY m."createdAt" DESC LIMIT 100`, r.PathValue("id"))
	})
	s.route(m, "POST /api/product-images", false, stock, s.uploadImage)
	s.route(m, "GET /api/product-images/{filename}", true, nil, s.image)
	s.route(m, "GET /api/customers", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return list(r.Context(), s.db, `SELECT to_jsonb(c)||jsonb_build_object('_count',jsonb_build_object('sales',(SELECT count(*) FROM "Sale" s WHERE s."customerId"=c.id AND status='COMPLETED'))) FROM "Customer" c WHERE c.active ORDER BY c.name`)
	})
	s.route(m, "POST /api/customers", false, sell, s.saveCustomer)
	s.route(m, "PATCH /api/customers/{id}", false, sell, s.saveCustomer)
	s.route(m, "DELETE /api/customers/{id}", false, admin, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return one(r.Context(), s.db, `UPDATE "Customer" c SET active=false WHERE id=$1 RETURNING to_jsonb(c)`, r.PathValue("id"))
	})
	s.route(m, "GET /api/sales", false, sell, s.sales)
	s.route(m, "GET /api/sales/{id}", false, sell, s.sale)
	s.route(m, "POST /api/sales", false, sell, s.createSale)
	s.route(m, "POST /api/sales/{id}/cancel", false, admin, s.cancelSale)
	s.route(m, "GET /api/dashboard", false, nil, s.dashboard)
	s.route(m, "GET /api/settings", false, nil, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return one(r.Context(), s.db, `SELECT to_jsonb(t) FROM "StoreSetting" t WHERE id=1`)
	})
	s.route(m, "PATCH /api/settings", false, admin, s.settings)
	s.route(m, "GET /api/users", false, admin, func(w http.ResponseWriter, r *http.Request) (any, error) {
		return list(r.Context(), s.db, `SELECT to_jsonb(u)-'password' FROM "User" u ORDER BY name`)
	})
	s.route(m, "POST /api/users", false, admin, s.createUser)
	s.route(m, "PATCH /api/users/{id}", false, admin, s.userActive)
}
func (s *server) login(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Email    string
		Password string
	}
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	b.Email = strings.ToLower(strings.TrimSpace(b.Email))
	if !validEmail(b.Email) || len(b.Password) == 0 || len(b.Password) > 128 {
		return nil, fail(400, "Ingresa un correo y contraseña válidos.")
	}
	key := peer(r) + ":" + b.Email
	s.mu.Lock()
	for k, a := range s.attempts {
		if time.Now().After(a.until) {
			delete(s.attempts, k)
		}
	}
	a := s.attempts[key]
	blocked := a.count >= 10
	s.mu.Unlock()
	if blocked {
		return nil, fail(429, "Demasiados intentos. Espera 15 minutos.")
	}
	u, e := one(r.Context(), s.db, `SELECT to_jsonb(u) FROM "User" u WHERE email=$1`, b.Email)
	if e != nil || u["active"] != true || bcrypt.CompareHashAndPassword([]byte(text(u, "password")), []byte(b.Password)) != nil {
		s.mu.Lock()
		a = s.attempts[key]
		if a.count == 0 {
			a.until = time.Now().Add(15 * time.Minute)
		}
		a.count++
		s.attempts[key] = a
		s.mu.Unlock()
		return nil, fail(401, "Correo o contraseña incorrectos.")
	}
	s.mu.Lock()
	delete(s.attempts, key)
	s.mu.Unlock()
	token, e := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{Subject: text(u, "id"), IssuedAt: jwt.NewNumericDate(time.Now()), ExpiresAt: jwt.NewNumericDate(time.Now().Add(8 * time.Hour))}).SignedString([]byte(s.secret))
	if e != nil {
		return nil, e
	}
	http.SetCookie(w, &http.Cookie{Name: "dp_session", Value: token, HttpOnly: true, SameSite: http.SameSiteStrictMode, Secure: s.secure, MaxAge: 8 * 3600, Path: "/"})
	delete(u, "password")
	return u, nil
}
func (s *server) password(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct{ CurrentPassword, NewPassword string }
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	if len(b.CurrentPassword) == 0 || len(b.CurrentPassword) > 128 || len(b.NewPassword) < 10 || len(b.NewPassword) > 72 {
		return nil, fail(400, "La nueva contraseña debe tener de 10 a 72 bytes.")
	}
	u, e := one(r.Context(), s.db, `SELECT to_jsonb(u) FROM "User" u WHERE id=$1`, user(r)["id"])
	if e != nil {
		return nil, e
	}
	if bcrypt.CompareHashAndPassword([]byte(text(u, "password")), []byte(b.CurrentPassword)) != nil {
		return nil, fail(400, "La contraseña actual es incorrecta.")
	}
	hashed, e := bcrypt.GenerateFromPassword([]byte(b.NewPassword), 12)
	if e != nil {
		return nil, e
	}
	_, e = s.db.ExecContext(r.Context(), `UPDATE "User" SET password=$1 WHERE id=$2`, string(hashed), user(r)["id"])
	return object{"ok": true}, e
}
func (s *server) createUser(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct{ Name, Email, Password, Role string }
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	b.Name = strings.TrimSpace(b.Name)
	b.Email = strings.ToLower(strings.TrimSpace(b.Email))
	if !validLen(b.Name, 2, 80) || !validEmail(b.Email) || len(b.Password) < 10 || len(b.Password) > 72 || (b.Role != "ADMIN" && b.Role != "CASHIER" && b.Role != "INVENTORY") {
		return nil, fail(400, "Revisa el nombre, correo, rol y contraseña (10 a 72 bytes).")
	}
	h, e := bcrypt.GenerateFromPassword([]byte(b.Password), 12)
	if e != nil {
		return nil, e
	}
	return one(r.Context(), s.db, `INSERT INTO "User" AS u (id,name,email,password,role) VALUES ($1,$2,$3,$4,$5) RETURNING to_jsonb(u)-'password'`, id(), b.Name, b.Email, string(h), b.Role)
}
func (s *server) userActive(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct{ Active *bool }
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	if b.Active == nil {
		return nil, fail(400, "Indica el estado del usuario.")
	}
	if r.PathValue("id") == text(user(r), "id") {
		return nil, fail(400, "No puedes desactivar tu propia cuenta.")
	}
	return one(r.Context(), s.db, `UPDATE "User" u SET active=$1 WHERE id=$2 RETURNING to_jsonb(u)-'password'`, *b.Active, r.PathValue("id"))
}
