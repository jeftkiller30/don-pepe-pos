package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

type object = map[string]any
type database interface {
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...any) *sql.Row
	ExecContext(context.Context, string, ...any) (sql.Result, error)
}
type apiError struct {
	status  int
	message string
}

func (e apiError) Error() string          { return e.message }
func fail(code int, message string) error { return apiError{code, message} }

type attempt struct {
	count int
	until time.Time
}
type server struct {
	db                   *sql.DB
	root, images, secret string
	attempts             map[string]attempt
	mu                   sync.Mutex
	secure               bool
}
type userKey struct{}

func user(r *http.Request) object    { return r.Context().Value(userKey{}).(object) }
func text(o object, k string) string { v, _ := o[k].(string); return v }
func number(o object, k string) int64 {
	switch v := o[k].(type) {
	case float64:
		return int64(v)
	case int64:
		return v
	case int:
		return int64(v)
	}
	return 0
}
func id() string {
	b := make([]byte, 16)
	if _, e := rand.Read(b); e != nil {
		panic(e)
	}
	b[6] = (b[6] & 15) | 64
	b[8] = (b[8] & 63) | 128
	s := hex.EncodeToString(b)
	return s[:8] + "-" + s[8:12] + "-" + s[12:16] + "-" + s[16:20] + "-" + s[20:]
}
func list(ctx context.Context, db database, query string, args ...any) ([]object, error) {
	rows, e := db.QueryContext(ctx, query, args...)
	if e != nil {
		return nil, e
	}
	defer rows.Close()
	out := []object{}
	for rows.Next() {
		var b []byte
		if e = rows.Scan(&b); e != nil {
			return nil, e
		}
		var obj object
		if e = json.Unmarshal(b, &obj); e != nil {
			return nil, e
		}
		out = append(out, obj)
	}
	return out, rows.Err()
}
func one(ctx context.Context, db database, query string, args ...any) (object, error) {
	var b []byte
	e := db.QueryRowContext(ctx, query, args...).Scan(&b)
	if errors.Is(e, sql.ErrNoRows) {
		return nil, fail(404, "No se encontró el registro.")
	}
	if e != nil {
		return nil, e
	}
	var obj object
	e = json.Unmarshal(b, &obj)
	return obj, e
}
func jsonResponse(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(normalizeDates(data))
}
func errorResponse(w http.ResponseWriter, e error) {
	var a apiError
	if errors.As(e, &a) {
		jsonResponse(w, a.status, object{"message": a.message})
		return
	}
	var p *pq.Error
	if errors.As(e, &p) {
		switch p.Code {
		case "23505":
			jsonResponse(w, 409, object{"message": "El código, documento o correo ya está registrado."})
			return
		case "23503", "23514":
			jsonResponse(w, 400, object{"message": "Datos inválidos o registro vinculado a otra operación."})
			return
		case "40001", "40P01":
			jsonResponse(w, 409, object{"message": "Otra operación modificó el stock. Actualiza e intenta nuevamente."})
			return
		}
	}
	log.Printf("Error de API: %v", e)
	jsonResponse(w, 500, object{"message": "No pudimos completar la operación. Intenta nuevamente."})
}
func decode(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 128*1024)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if e := d.Decode(dst); e != nil {
		return fail(400, "Revisa los campos: el formato o los datos enviados no son válidos.")
	}
	if e := d.Decode(new(any)); e != io.EOF {
		return fail(400, "El cuerpo debe contener un solo objeto JSON.")
	}
	return nil
}
func validLen(s string, min, max int) bool {
	n := utf8.RuneCountInString(strings.TrimSpace(s))
	return n >= min && n <= max
}

var emailPattern = regexp.MustCompile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

func validEmail(s string) bool { return len(s) <= 160 && emailPattern.MatchString(s) }

type endpoint func(http.ResponseWriter, *http.Request) (any, error)

func (s *server) route(mux *http.ServeMux, pattern string, public bool, roles []string, fn endpoint) {
	mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
		if !public {
			cookie, e := r.Cookie("dp_session")
			if e != nil {
				errorResponse(w, fail(401, "Inicia sesión para continuar."))
				return
			}
			claims := jwt.RegisteredClaims{}
			token, e := jwt.ParseWithClaims(cookie.Value, &claims, func(t *jwt.Token) (any, error) { return []byte(s.secret), nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
			if e != nil || !token.Valid {
				errorResponse(w, fail(401, "Tu sesión ha vencido."))
				return
			}
			u, e := one(r.Context(), s.db, `SELECT to_jsonb(u)-'password' FROM "User" u WHERE id=$1 AND active=true`, claims.Subject)
			if e != nil {
				errorResponse(w, fail(401, "Tu sesión ha vencido."))
				return
			}
			if len(roles) > 0 {
				allowed := false
				for _, role := range roles {
					if text(u, "role") == role {
						allowed = true
					}
				}
				if !allowed {
					errorResponse(w, fail(403, "No tienes permiso para esta acción."))
					return
				}
			}
			r = r.WithContext(context.WithValue(r.Context(), userKey{}, u))
		}
		result, e := fn(w, r)
		if e != nil {
			errorResponse(w, e)
			return
		}
		if result != nil {
			status := 200
			if r.Method == "POST" {
				status = 201
			}
			jsonResponse(w, status, result)
		}
	})
}
func (s *server) handler() http.Handler {
	mux := http.NewServeMux()
	s.register(mux)
	web := filepath.Join(s.root, "dist", "react")
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			jsonResponse(w, 404, object{"message": "Ruta no encontrada."})
			return
		}
		if r.Method != "GET" && r.Method != "HEAD" {
			w.WriteHeader(405)
			return
		}
		rel := filepath.Clean(filepath.FromSlash(strings.TrimPrefix(r.URL.Path, "/")))
		if !filepath.IsLocal(rel) {
			http.NotFound(w, r)
			return
		}
		p := filepath.Join(web, rel)
		if info, e := os.Stat(p); e == nil && !info.IsDir() {
			http.ServeFile(w, r, p)
			return
		}
		if _, e := os.Stat(filepath.Join(web, "index.html")); e != nil {
			jsonResponse(w, 200, object{"backend": "Go", "frontend": "Inicia React con npm run dev en frontend. Puerto 4200."})
			return
		}
		http.ServeFile(w, r, filepath.Join(web, "index.html"))
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if e := recover(); e != nil {
				log.Printf("Panic: %v", e)
				jsonResponse(w, 500, object{"message": "No pudimos completar la operación."})
			}
		}()
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "same-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		if r.Method != "GET" && r.Method != "HEAD" && r.Method != "OPTIONS" {
			origin := r.Header.Get("Origin")
			allowed := origin == ""
			for _, a := range []string{os.Getenv("APP_ORIGIN"), "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4200", "http://127.0.0.1:4200"} {
				if a != "" && origin == a {
					allowed = true
				}
			}
			if !allowed {
				errorResponse(w, fail(403, "Origen no permitido."))
				return
			}
		}
		mux.ServeHTTP(w, r)
	})
}
func dates(r *http.Request) (time.Time, time.Time, error) {
	loc := time.FixedZone("America/Lima", -5*3600)
	today := time.Now().In(loc).Format("2006-01-02")
	from, to := r.URL.Query().Get("from"), r.URL.Query().Get("to")
	if from == "" {
		from = today
	}
	if to == "" {
		to = today
	}
	start, e1 := time.ParseInLocation("2006-01-02", from, loc)
	end, e2 := time.ParseInLocation("2006-01-02", to, loc)
	end = end.AddDate(0, 0, 1)
	if e1 != nil || e2 != nil || !end.After(start) || end.Sub(start) > 366*24*time.Hour {
		return start, end, fail(400, "El rango debe ser válido y de hasta un año.")
	}
	return start.UTC(), end.UTC(), nil
}
func peer(r *http.Request) string { host, _, _ := net.SplitHostPort(r.RemoteAddr); return host }
func ticket(n int64) string       { return fmt.Sprintf("V-%06d", n) }

func normalizeDates(value any) any {
	switch v := value.(type) {
	case map[string]any:
		for key, item := range v {
			if key == "createdAt" || key == "updatedAt" || key == "cancelledAt" {
				if stamp, ok := item.(string); ok {
					if t := parseTimestamp(stamp); !t.IsZero() {
						v[key] = t.UTC().Format(time.RFC3339Nano)
					}
				}
			} else {
				v[key] = normalizeDates(item)
			}
		}
	case []object:
		for _, item := range v {
			normalizeDates(item)
		}
	case []any:
		for _, item := range v {
			normalizeDates(item)
		}
	}
	return value
}
