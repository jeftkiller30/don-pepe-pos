package main

import (
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"time"
)

const saleQuery = `SELECT to_jsonb(s)||jsonb_build_object('items',COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id) FROM "SaleItem" i WHERE i."saleId"=s.id),'[]'::jsonb),'cashier',(SELECT jsonb_build_object('name',u.name) FROM "User" u WHERE u.id=s."cashierId"),'customer',(SELECT to_jsonb(c) FROM "Customer" c WHERE c.id=s."customerId")) FROM "Sale" s `

var uuidPattern = regexp.MustCompile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")

func (s *server) sales(w http.ResponseWriter, r *http.Request) (any, error) {
	from, to, e := dates(r)
	if e != nil {
		return nil, e
	}
	return list(r.Context(), s.db, saleQuery+`WHERE s."createdAt">=$1 AND s."createdAt"<$2 ORDER BY s."createdAt" DESC`, from, to)
}
func saleID(r *http.Request) (int64, error) {
	v, e := strconv.ParseInt(r.PathValue("id"), 10, 32)
	if e != nil || v <= 0 {
		return 0, fail(400, "Ticket inválido.")
	}
	return v, nil
}
func (s *server) sale(w http.ResponseWriter, r *http.Request) (any, error) {
	n, e := saleID(r)
	if e != nil {
		return nil, e
	}
	return one(r.Context(), s.db, saleQuery+"WHERE s.id=$1", n)
}
func (s *server) createSale(w http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		RequestId string
		Items     []struct {
			ProductId string
			Quantity  int64
		}
		Payment            string
		Received, Discount *int64
		CustomerId         string
	}
	if e := decode(w, r, &b); e != nil {
		return nil, e
	}
	if !uuidPattern.MatchString(b.RequestId) || len(b.Items) < 1 || len(b.Items) > 100 || b.Received == nil || b.Discount == nil || *b.Received < 0 || *b.Received > 100000000 || *b.Discount < 0 || *b.Discount > 100000000 || (b.Payment != "CASH" && b.Payment != "YAPE" && b.Payment != "CARD") || len(b.CustomerId) > 40 {
		return nil, fail(400, "Revisa los datos de la venta.")
	}
	seen := map[string]bool{}
	for _, i := range b.Items {
		if len(i.ProductId) == 0 || len(i.ProductId) > 40 || i.Quantity < 1 || i.Quantity > 10000 {
			return nil, fail(400, "Producto o cantidad inválidos.")
		}
		if seen[i.ProductId] {
			return nil, fail(400, "Agrupa los productos repetidos.")
		}
		seen[i.ProductId] = true
	}
	ctx := r.Context()
	tx, e := s.db.BeginTx(ctx, nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	// Serialize retries for the same request before touching inventory.
	if _, e = tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1,0))", b.RequestId); e != nil {
		return nil, e
	}
	existing, e := list(ctx, tx, saleQuery+`WHERE s."requestId"=$1`, b.RequestId)
	if e != nil {
		return nil, e
	}
	if len(existing) > 0 {
		if existing[0]["cashierId"] != user(r)["id"] {
			return nil, fail(409, "Identificador ya utilizado.")
		}
		return existing[0], nil
	}
	if *b.Discount > 0 && text(user(r), "role") != "ADMIN" {
		return nil, fail(403, "Solo un administrador puede aplicar descuentos.")
	}
	sort.Slice(b.Items, func(i, j int) bool { return b.Items[i].ProductId < b.Items[j].ProductId })
	lines := []object{}
	var subtotal int64
	for _, i := range b.Items {
		p, e := one(ctx, tx, `SELECT to_jsonb(p) FROM "Product" p WHERE id=$1 AND active FOR UPDATE`, i.ProductId)
		if e != nil {
			if a, ok := e.(apiError); ok && a.status == 404 {
				return nil, fail(409, "Producto no disponible.")
			}
			return nil, e
		}
		if number(p, "stock") < i.Quantity {
			return nil, fail(409, "Stock insuficiente. Actualiza los productos.")
		}
		price := number(p, "price")
		total := price * i.Quantity
		subtotal += total
		lines = append(lines, object{"id": id(), "productId": i.ProductId, "name": p["name"], "sku": p["sku"], "price": price, "quantity": i.Quantity, "total": total})
	}
	total := subtotal - *b.Discount
	if total <= 0 {
		return nil, fail(400, "El descuento debe ser menor al subtotal.")
	}
	received := *b.Received
	if b.Payment != "CASH" {
		received = total
	}
	if received < total {
		return nil, fail(400, "El efectivo recibido no cubre el total.")
	}
	customerName := "Público general"
	if b.CustomerId != "" {
		c, e := one(ctx, tx, `SELECT to_jsonb(c) FROM "Customer" c WHERE id=$1 AND active FOR SHARE`, b.CustomerId)
		if e != nil {
			return nil, fail(400, "Cliente no disponible.")
		}
		customerName = text(c, "name")
	}
	var sid int64
	e = tx.QueryRowContext(ctx, `INSERT INTO "Sale" ("requestId",subtotal,discount,total,received,change,payment,"cashierId","customerId","customerName") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, b.RequestId, subtotal, *b.Discount, total, received, received-total, b.Payment, user(r)["id"], nullable(b.CustomerId), customerName).Scan(&sid)
	if e != nil {
		return nil, e
	}
	for _, i := range lines {
		_, e = tx.ExecContext(ctx, `UPDATE "Product" SET stock=stock-$1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$2`, i["quantity"], i["productId"])
		if e != nil {
			return nil, e
		}
		_, e = tx.ExecContext(ctx, `INSERT INTO "SaleItem" (id,"saleId","productId",name,sku,price,quantity,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, i["id"], sid, i["productId"], i["name"], i["sku"], i["price"], i["quantity"], i["total"])
		if e != nil {
			return nil, e
		}
		_, e = tx.ExecContext(ctx, `INSERT INTO "StockMovement" (id,"productId","userId",quantity,reason) VALUES ($1,$2,$3,$4,$5)`, id(), i["productId"], user(r)["id"], -number(i, "quantity"), "Venta "+ticket(sid))
		if e != nil {
			return nil, e
		}
	}
	result, e := one(ctx, tx, saleQuery+"WHERE s.id=$1", sid)
	if e != nil {
		return nil, e
	}
	if e = tx.Commit(); e != nil {
		return nil, e
	}
	return result, nil
}
func (s *server) cancelSale(w http.ResponseWriter, r *http.Request) (any, error) {
	sid, e := saleID(r)
	if e != nil {
		return nil, e
	}
	var b struct{ Reason string }
	if e = decode(w, r, &b); e != nil {
		return nil, e
	}
	if !validLen(b.Reason, 5, 200) {
		return nil, fail(400, "Indica un motivo de 5 a 200 caracteres.")
	}
	ctx := r.Context()
	tx, e := s.db.BeginTx(ctx, nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	res, e := tx.ExecContext(ctx, `UPDATE "Sale" SET status='CANCELLED',"cancelReason"=$1,"cancelledBy"=$2,"cancelledAt"=CURRENT_TIMESTAMP WHERE id=$3 AND status='COMPLETED'`, b.Reason, user(r)["id"], sid)
	if e != nil {
		return nil, e
	}
	count, e := res.RowsAffected()
	if e != nil {
		return nil, e
	}
	if count == 0 {
		return nil, fail(409, "La venta ya fue anulada o no existe.")
	}
	items, e := list(ctx, tx, `SELECT to_jsonb(i) FROM "SaleItem" i WHERE "saleId"=$1 ORDER BY "productId"`, sid)
	if e != nil {
		return nil, e
	}
	for _, i := range items {
		_, e = tx.ExecContext(ctx, `UPDATE "Product" SET stock=stock+$1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$2`, i["quantity"], i["productId"])
		if e != nil {
			return nil, e
		}
		_, e = tx.ExecContext(ctx, `INSERT INTO "StockMovement" (id,"productId","userId",quantity,reason) VALUES ($1,$2,$3,$4,$5)`, id(), i["productId"], user(r)["id"], i["quantity"], "Anulación "+ticket(sid)+": "+b.Reason)
		if e != nil {
			return nil, e
		}
	}
	result, e := one(ctx, tx, saleQuery+"WHERE s.id=$1", sid)
	if e != nil {
		return nil, e
	}
	return result, tx.Commit()
}
func parseTimestamp(value string) time.Time {
	for _, format := range []string{time.RFC3339Nano, "2006-01-02T15:04:05.999999999", "2006-01-02T15:04:05"} {
		if t, e := time.Parse(format, value); e == nil {
			return t
		}
	}
	return time.Time{}
}
func (s *server) dashboard(w http.ResponseWriter, r *http.Request) (any, error) {
	from, to, e := dates(r)
	if e != nil {
		return nil, e
	}
	ctx := r.Context()
	sales, e := list(ctx, s.db, saleQuery+`WHERE s.status='COMPLETED' AND s."createdAt">=$1 AND s."createdAt"<$2`, from, to)
	if e != nil {
		return nil, e
	}
	products, e := list(ctx, s.db, `SELECT to_jsonb(p) FROM "Product" p WHERE active ORDER BY stock`)
	if e != nil {
		return nil, e
	}
	var previous int64
	e = s.db.QueryRowContext(ctx, `SELECT COALESCE(sum(total),0) FROM "Sale" WHERE status='COMPLETED' AND "createdAt">=$1 AND "createdAt"<$2`, from.Add(-to.Sub(from)), from).Scan(&previous)
	if e != nil {
		return nil, e
	}
	var revenue, units, stockValue int64
	customers := map[string]bool{}
	top := map[string]object{}
	daily := map[string]int64{}
	payments := object{"CASH": int64(0), "YAPE": int64(0), "CARD": int64(0)}
	hours := make([]object, 24)
	for i := range hours {
		hours[i] = object{"hour": i, "total": int64(0)}
	}
	low := []object{}
	images := map[string]string{}
	for _, p := range products {
		stockValue += number(p, "stock") * number(p, "price")
		images[text(p, "id")] = text(p, "image")
		if number(p, "stock") <= number(p, "minStock") {
			low = append(low, p)
		}
	}
	for _, sale := range sales {
		total := number(sale, "total")
		revenue += total
		if customer := text(sale, "customerId"); customer != "" {
			customers[customer] = true
		}
		method := text(sale, "payment")
		payments[method] = number(payments, method) + total
		local := parseTimestamp(text(sale, "createdAt")).In(time.FixedZone("Lima", -5*3600))
		hours[local.Hour()]["total"] = number(hours[local.Hour()], "total") + total
		daily[local.Format("2006-01-02")] += total
		for _, v := range sale["items"].([]any) {
			i := v.(map[string]any)
			qty := number(i, "quantity")
			units += qty
			pid := text(i, "productId")
			p := top[pid]
			if p == nil {
				image := images[pid]
				if image == "" {
					image = "box"
				}
				p = object{"id": pid, "name": i["name"], "image": image, "quantity": int64(0), "total": int64(0)}
				top[pid] = p
			}
			p["quantity"] = number(p, "quantity") + qty
			p["total"] = number(p, "total") + number(i, "total")
		}
	}
	tops := []object{}
	for _, p := range top {
		tops = append(tops, p)
	}
	sort.Slice(tops, func(i, j int) bool { return number(tops[i], "quantity") > number(tops[j], "quantity") })
	days := []object{}
	keys := []string{}
	for k := range daily {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		days = append(days, object{"day": k, "total": daily[k]})
	}
	var change any
	if previous > 0 {
		change = math.Round(float64(revenue-previous) * 100 / float64(previous))
	}
	average := int64(0)
	if len(sales) > 0 {
		average = int64(math.Round(float64(revenue) / float64(len(sales))))
	}
	return object{"revenue": revenue, "tickets": len(sales), "units": units, "customers": len(customers), "average": average, "change": change, "lowStock": low, "topProducts": tops, "hours": hours, "daily": days, "payments": payments, "productCount": len(products), "stockValue": stockValue}, nil
}
