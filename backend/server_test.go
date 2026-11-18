package main

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestDateRangeUsesLimaDaysInUTC(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/sales?from=2026-10-27&to=2026-10-27", nil)
	start, end, err := dates(request)
	if err != nil {
		t.Fatal(err)
	}
	if start.Format(time.RFC3339) != "2026-10-27T05:00:00Z" || end.Format(time.RFC3339) != "2026-10-28T05:00:00Z" {
		t.Fatalf("Intervalo incorrecto: %s — %s", start, end)
	}
	lateSale, _ := time.Parse(time.RFC3339, "2026-10-28T01:00:00Z")
	if lateSale.Before(start) || !lateSale.Before(end) {
		t.Fatal("La venta de las 20:00 de Lima debe pertenecer al día 27")
	}
}
