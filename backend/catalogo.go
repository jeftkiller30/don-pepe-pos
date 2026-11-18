package main

import (
	"bytes"
	"encoding/binary"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var skuPattern = regexp.MustCompile("^[A-Za-z0-9_-]{1,40}$")
var docPattern = regexp.MustCompile("^[0-9A-Za-z-]{5,20}$")
var uploadedPattern = regexp.MustCompile("^upload-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|png|webp)$")
var baseImages = regexp.MustCompile("^(snack|cookie|drink|candy|soap|pencil|box|cheetos|field-vainilla|inca-kola|ambrosoli-gomitas|bolivar|faber-castell|casino|cielo|ambrosoli-mentitas|karinto|vinifan|scotch-brite)$")

func (s *server) saveProduct(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Name, Sku, Category, Image string
		Price, MinStock            *int
	}
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	b.Name = strings.TrimSpace(b.Name)
	b.Category = strings.TrimSpace(b.Category)
	if !validLen(b.Name, 2, 100) || !skuPattern.MatchString(b.Sku) || !validLen(b.Category, 2, 50) || b.MinStock == nil || *b.MinStock < 0 || *b.MinStock > 100000 {
		return nil, fail(400, "Revisa el nombre, código, categoría y stock mínimo.")
	}
	if b.Price == nil || *b.Price != 100 {
		return nil, fail(400, "Todos los productos cuestan S/ 1.00.")
	}
	if !baseImages.MatchString(b.Image) {
		if !uploadedPattern.MatchString(b.Image) {
			return nil, fail(400, "Fotografía inválida.")
		}
		if _, e := os.Stat(filepath.Join(s.images, b.Image)); e != nil {
			return nil, fail(400, "No se encontró la fotografía. Vuelve a seleccionarla.")
		}
	}
	if r.Method == "POST" {
		return one(r.Context(), s.db, `INSERT INTO "Product" AS p (id,name,sku,category,price,"minStock",image,"updatedAt") VALUES ($1,$2,$3,$4,100,$5,$6,CURRENT_TIMESTAMP) RETURNING to_jsonb(p)`, id(), b.Name, b.Sku, b.Category, *b.MinStock, b.Image)
	}
	return one(r.Context(), s.db, `UPDATE "Product" p SET name=$1,sku=$2,category=$3,price=100,"minStock"=$4,image=$5,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$6 RETURNING to_jsonb(p)`, b.Name, b.Sku, b.Category, *b.MinStock, b.Image, r.PathValue("id"))
}
func (s *server) stock(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Quantity int
		Reason   string
	}
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	if b.Quantity == 0 || b.Quantity < -100000 || b.Quantity > 100000 || !validLen(b.Reason, 3, 200) {
		return nil, fail(400, "Indica una cantidad distinta de cero y un motivo de 3 a 200 caracteres.")
	}
	tx, e := s.db.BeginTx(r.Context(), nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	p, e := one(r.Context(), tx, `UPDATE "Product" p SET stock=stock+$1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$2 AND active AND stock+$1>=0 RETURNING to_jsonb(p)`, b.Quantity, r.PathValue("id"))
	if e != nil {
		if a, ok := e.(apiError); ok && a.status == 404 {
			return nil, fail(409, "Producto inexistente o stock insuficiente.")
		}
		return nil, e
	}
	_, e = tx.ExecContext(r.Context(), `INSERT INTO "StockMovement" (id,"productId","userId",quantity,reason) VALUES ($1,$2,$3,$4,$5)`, id(), r.PathValue("id"), user(r)["id"], b.Quantity, strings.TrimSpace(b.Reason))
	if e != nil {
		return nil, e
	}
	return p, tx.Commit()
}
func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}
func (s *server) saveCustomer(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct{ Name, Document, Phone, Email string }
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	b.Name = strings.TrimSpace(b.Name)
	if !validLen(b.Name, 2, 100) || len(b.Phone) > 30 || (b.Document != "" && !docPattern.MatchString(b.Document)) || (b.Email != "" && !validEmail(b.Email)) {
		return nil, fail(400, "Revisa los datos del cliente.")
	}
	if r.Method == "POST" {
		return one(r.Context(), s.db, `INSERT INTO "Customer" AS c (id,name,document,phone,email) VALUES ($1,$2,$3,$4,$5) RETURNING to_jsonb(c)`, id(), b.Name, nullable(b.Document), nullable(b.Phone), nullable(b.Email))
	}
	return one(r.Context(), s.db, `UPDATE "Customer" c SET name=$1,document=$2,phone=$3,email=$4 WHERE id=$5 RETURNING to_jsonb(c)`, b.Name, nullable(b.Document), nullable(b.Phone), nullable(b.Email), r.PathValue("id"))
}
func (s *server) settings(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct{ Name, Address, Phone, ReceiptMessage string }
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	if !validLen(b.Name, 2, 100) || !validLen(b.Address, 2, 200) || len(b.Phone) > 30 || !validLen(b.ReceiptMessage, 0, 200) {
		return nil, fail(400, "Revisa los datos de la tienda.")
	}
	return one(r.Context(), s.db, `UPDATE "StoreSetting" t SET name=$1,address=$2,phone=$3,"receiptMessage"=$4 WHERE id=1 RETURNING to_jsonb(t)`, b.Name, b.Address, b.Phone, b.ReceiptMessage)
}
func (s *server) uploadImage(w http.ResponseWriter, r *http.Request) (any, error) {
	const limit = 5 * 1024 * 1024
	b, e := io.ReadAll(http.MaxBytesReader(w, r.Body, limit))
	if e != nil {
		return nil, fail(413, "La imagen no debe superar los 5 MB.")
	}
	if len(b) < 12 {
		return nil, fail(400, "Selecciona una imagen JPG, PNG o WebP válida.")
	}
	ct := strings.ToLower(strings.TrimSpace(strings.Split(r.Header.Get("Content-Type"), ";")[0]))
	ext := ""
	if ct == "image/jpeg" && bytes.Equal(b[:3], []byte{255, 216, 255}) && bytes.Equal(b[len(b)-2:], []byte{255, 217}) {
		ext = "jpg"
	}
	if ct == "image/png" && len(b) >= 33 && bytes.Equal(b[:8], []byte{137, 80, 78, 71, 13, 10, 26, 10}) && string(b[12:16]) == "IHDR" && string(b[len(b)-8:len(b)-4]) == "IEND" {
		ext = "png"
	}
	if ct == "image/webp" && string(b[:4]) == "RIFF" && string(b[8:12]) == "WEBP" && int(binary.LittleEndian.Uint32(b[4:8]))+8 == len(b) {
		ext = "webp"
	}
	if ext == "" {
		return nil, fail(400, "El archivo debe ser una imagen JPG, PNG o WebP válida.")
	}
	filename := "upload-" + id() + "." + ext
	if e = os.MkdirAll(s.images, 0700); e != nil {
		return nil, e
	}
	f, e := os.OpenFile(filepath.Join(s.images, filename), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if e != nil {
		return nil, e
	}
	_, e = f.Write(b)
	closeErr := f.Close()
	if e != nil {
		return nil, e
	}
	if closeErr != nil {
		return nil, closeErr
	}
	return object{"image": filename}, nil
}
func (s *server) image(w http.ResponseWriter, r *http.Request) (any, error) {
	filename := r.PathValue("filename")
	if !uploadedPattern.MatchString(filename) {
		return nil, fail(404, "Imagen no encontrada.")
	}
	p := filepath.Join(s.images, filename)
	if _, e := os.Stat(p); e != nil {
		return nil, fail(404, "Imagen no encontrada.")
	}
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	http.ServeFile(w, r, p)
	return nil, nil
}
