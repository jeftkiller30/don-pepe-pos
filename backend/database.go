package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"io"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"syscall"
)

//go:embed migrations/*/migration.sql
var migrationFiles embed.FS
var identifier = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func connectionURL(raw string) (*url.URL, error) {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" || (u.Scheme != "postgres" && u.Scheme != "postgresql") {
		return nil, fmt.Errorf("configura DATABASE_URL en .env")
	}
	q := u.Query()
	if schema := q.Get("schema"); schema != "" {
		if !identifier.MatchString(schema) {
			return nil, fmt.Errorf("esquema inválido")
		}
		q.Del("schema")
		q.Set("search_path", schema)
	}
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "disable")
	}
	q.Set("timezone", "UTC")
	q.Set("connect_timeout", "5")
	u.RawQuery = q.Encode()
	return u, nil
}
func openDatabase(raw string) (*sql.DB, error) {
	u, err := connectionURL(raw)
	if err != nil {
		return nil, err
	}
	db, err := sql.Open("postgres", u.String())
	if err == nil {
		db.SetMaxOpenConns(15)
		db.SetMaxIdleConns(5)
	}
	return db, err
}

func migrateDatabase(ctx context.Context, db *sql.DB) error {
	conn, err := db.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()
	if _, err = conn.ExecContext(ctx, `SELECT pg_advisory_lock(174202610)`); err != nil {
		return err
	}
	defer conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock(174202610)`)
	var schema string
	if err = conn.QueryRowContext(ctx, `SELECT COALESCE(current_schema(),split_part(current_setting('search_path'),',',1))`).Scan(&schema); err != nil {
		return err
	}
	if !identifier.MatchString(schema) {
		return fmt.Errorf("esquema inválido o inexistente")
	}
	if _, err = conn.ExecContext(ctx, "CREATE SCHEMA IF NOT EXISTS "+pq.QuoteIdentifier(schema)); err != nil {
		return err
	}
	if _, err = conn.ExecContext(ctx, "SET search_path TO "+pq.QuoteIdentifier(schema)); err != nil {
		return err
	}
	if _, err = conn.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS "_donpepe_go_migrations" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	var old sql.NullString
	if err = conn.QueryRowContext(ctx, `SELECT to_regclass('_prisma_migrations')::text`).Scan(&old); err != nil {
		return err
	}
	previous := map[string]bool{}
	if old.Valid {
		rows, err := conn.QueryContext(ctx, `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)
		if err != nil {
			return err
		}
		for rows.Next() {
			var name string
			if err = rows.Scan(&name); err != nil {
				rows.Close()
				return err
			}
			previous[name] = true
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return err
		}
	}
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		name := entry.Name()
		content, err := migrationFiles.ReadFile("migrations/" + name + "/migration.sql")
		if err != nil {
			return err
		}
		digest := sha256.Sum256(content)
		checksum := hex.EncodeToString(digest[:])
		var existing string
		err = conn.QueryRowContext(ctx, `SELECT checksum FROM "_donpepe_go_migrations" WHERE name=$1`, name).Scan(&existing)
		if err == nil {
			if existing != checksum {
				return fmt.Errorf("migración modificada: %s", name)
			}
			continue
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		tx, err := conn.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		if !previous[name] {
			_, err = tx.ExecContext(ctx, string(content))
		}
		if err == nil {
			_, err = tx.ExecContext(ctx, `INSERT INTO "_donpepe_go_migrations"(name,checksum) VALUES($1,$2)`, name, checksum)
		}
		if err != nil {
			tx.Rollback()
			return err
		}
		if err = tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func postgresCommand(ctx context.Context, binary string, args ...string) error {
	cmd := exec.CommandContext(ctx, binary, args...)
	hideWindow(cmd)
	// A daemon must not inherit the terminal/test runner pipe on Windows.
	output, err := os.CreateTemp("", "donpepe-postgres-*.log")
	if err != nil {
		return err
	}
	defer os.Remove(output.Name())
	defer output.Close()
	cmd.Stdout = output
	cmd.Stderr = output
	err = cmd.Run()
	_, _ = output.Seek(0, 0)
	_, _ = io.Copy(os.Stdout, output)
	return err
}
func ensureLocalDatabase(ctx context.Context, root, raw string) error {
	if _, err := os.Stat(filepath.Join(root, ".runtime", "local-mode")); errors.Is(err, os.ErrNotExist) {
		return nil
	} else if err != nil {
		return err
	}
	if runtime.GOOS != "windows" {
		return fmt.Errorf("configura PostgreSQL y DATABASE_URL para este equipo")
	}
	u, err := connectionURL(raw)
	if err != nil {
		return err
	}
	if u.Hostname() != "127.0.0.1" && u.Hostname() != "localhost" {
		return fmt.Errorf("el modo PostgreSQL local requiere una dirección local")
	}
	name := strings.TrimPrefix(u.Path, "/")
	if !identifier.MatchString(name) {
		return fmt.Errorf("nombre de base inválido")
	}
	u.Path = "/postgres"
	q := u.Query()
	q.Del("search_path")
	u.RawQuery = q.Encode()
	admin, err := openDatabase(u.String())
	if err != nil {
		return err
	}
	defer admin.Close()
	err = admin.PingContext(ctx)
	if err != nil {
		var operation *net.OpError
		if !errors.As(err, &operation) || !(errors.Is(operation.Err, syscall.ECONNREFUSED) || (runtime.GOOS == "windows" && errors.Is(operation.Err, syscall.Errno(10061)))) {
			return fmt.Errorf("no se pudo acceder a PostgreSQL; no se iniciará otra instancia: %w", err)
		}
		bin := os.Getenv("POSTGRES_BIN")
		if bin == "" {
			bin = `C:\Program Files\PostgreSQL\17\bin`
		}
		control := filepath.Join(bin, "pg_ctl.exe")
		if _, err = os.Stat(control); err != nil {
			return fmt.Errorf("instala PostgreSQL 17 o configura POSTGRES_BIN")
		}
		dir := filepath.Join(root, ".runtime", "postgres")
		if _, err = os.Stat(filepath.Join(dir, "PG_VERSION")); errors.Is(err, os.ErrNotExist) {
			password, _ := u.User.Password()
			file, err := os.CreateTemp(filepath.Join(root, ".runtime"), "pg-password-")
			if err != nil {
				return err
			}
			filename := file.Name()
			if _, err = file.WriteString(password); err != nil {
				file.Close()
				os.Remove(filename)
				return err
			}
			file.Close()
			err = postgresCommand(ctx, filepath.Join(bin, "initdb.exe"), "-D", dir, "-U", u.User.Username(), "-A", "scram-sha-256", "--pwfile", filename, "--encoding=UTF8", "--locale=C")
			os.Remove(filename)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
		status := exec.CommandContext(ctx, control, "-D", dir, "status")
		hideWindow(status)
		if status.Run() != nil {
			port := u.Port()
			if port == "" {
				port = "5432"
			}
			if !regexp.MustCompile(`^\d{1,5}$`).MatchString(port) {
				return fmt.Errorf("puerto PostgreSQL inválido")
			}
			if err = postgresCommand(ctx, control, "-D", dir, "-l", filepath.Join(root, ".runtime", "postgres-go.log"), "-o", "-p "+port+" -h 127.0.0.1", "-w", "start"); err != nil {
				return err
			}
		}
		if err = admin.PingContext(ctx); err != nil {
			return err
		}
	}
	var exists bool
	if err = admin.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1)`, name).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		_, err = admin.ExecContext(ctx, "CREATE DATABASE "+pq.QuoteIdentifier(name))
	}
	return err
}

func seedEmptyDatabase(ctx context.Context, db *sql.DB, root, password string) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(174202611)`); err != nil {
		return err
	}
	var count int
	if err = tx.QueryRowContext(ctx, `SELECT count(*) FROM "User"`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if len(password) < 10 || len(password) > 72 {
		return fmt.Errorf("para una base nueva configura SEED_ADMIN_PASSWORD (10 a 72 bytes) en .env")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	uid := id()
	if _, err = tx.ExecContext(ctx, `INSERT INTO "User"(id,name,email,password,role) VALUES($1,'Jefferson','admin@donpepe.local',$2,'ADMIN')`, uid, string(hash)); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO "StoreSetting"(id) VALUES(1) ON CONFLICT(id) DO NOTHING`); err != nil {
		return err
	}
	content, err := os.ReadFile(filepath.Join(root, "frontend", "product-catalog.json"))
	if err != nil {
		return err
	}
	var products []struct {
		Sku, Name, Category, Image string
		Stock, MinStock            int
	}
	if err = json.Unmarshal(content, &products); err != nil {
		return err
	}
	for _, p := range products {
		pid := id()
		result, err := tx.ExecContext(ctx, `INSERT INTO "Product"(id,sku,name,category,price,stock,"minStock",image,"updatedAt") VALUES($1,$2,$3,$4,100,$5,$6,$7,now()) ON CONFLICT(sku) DO NOTHING`, pid, p.Sku, p.Name, p.Category, p.Stock, p.MinStock, p.Image)
		if err != nil {
			return err
		}
		n, _ := result.RowsAffected()
		if n > 0 && p.Stock > 0 {
			if _, err = tx.ExecContext(ctx, `INSERT INTO "StockMovement"(id,"productId","userId",quantity,reason) VALUES($1,$2,$3,$4,'Inventario inicial de demostración')`, id(), pid, uid, p.Stock); err != nil {
				return err
			}
		}
	}
	return tx.Commit()
}
