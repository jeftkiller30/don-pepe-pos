package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"github.com/joho/godotenv"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
func run() error {
	setup := flag.Bool("setup", false, "Preparar la base y salir")
	flag.Parse()
	root := os.Getenv("DON_PEPE_ROOT")
	if root == "" {
		var err error
		root, err = os.Getwd()
		if err != nil {
			return err
		}
		if filepath.Base(root) == "backend" {
			root = filepath.Dir(root)
		}
	}
	_ = godotenv.Load(filepath.Join(root, ".env"))
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		return fmt.Errorf("JWT_SECRET debe contener al menos 32 caracteres")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	var listener net.Listener
	if !*setup {
		var err error
		listener, err = net.Listen("tcp", "127.0.0.1:"+port)
		if err != nil {
			return fmt.Errorf("el puerto %s no está disponible; cierra el backend anterior con Ctrl+C: %w", port, err)
		}
		defer listener.Close()
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	if err := ensureLocalDatabase(ctx, root, os.Getenv("DATABASE_URL")); err != nil {
		return err
	}
	db, err := openDatabase(os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer db.Close()
	if err = db.PingContext(ctx); err != nil {
		return fmt.Errorf("no se pudo conectar con PostgreSQL: %w", err)
	}
	if err = migrateDatabase(ctx, db); err != nil {
		return fmt.Errorf("migraciones: %w", err)
	}
	if err = seedEmptyDatabase(ctx, db, root, os.Getenv("SEED_ADMIN_PASSWORD")); err != nil {
		return err
	}
	if *setup {
		fmt.Println("Base preparada desde Go. Usuarios y datos existentes conservados.")
		return nil
	}
	images := os.Getenv("PRODUCT_IMAGE_DIRECTORY")
	if images == "" {
		images = filepath.Join(root, ".runtime", "product-images")
	}
	if err = os.MkdirAll(images, 0700); err != nil {
		return err
	}
	s := &server{db: db, root: root, images: images, secret: secret, attempts: map[string]attempt{}, secure: os.Getenv("APP_ENV") == "production"}
	srv := &http.Server{Handler: s.handler(), ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdown)
	}()
	fmt.Printf("Don Pepe · Backend Go disponible en http://127.0.0.1:%s\n", port)
	if err = srv.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
