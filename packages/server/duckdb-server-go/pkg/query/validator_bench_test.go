package query

import (
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
)

func BenchmarkValidateSQL(b *testing.B) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	if err != nil {
		b.Fatal(err)
	}
	defer connector.Close()
	db, err := New(b.Context(), connector)
	if err != nil {
		b.Fatal(err)
	}
	defer db.Close()
	for _, query := range []struct{ name, sql string }{
		{"simple", "SELECT * FROM tenant_a.orders"},
		{"cte", "WITH a AS (SELECT id, sum(value) AS total FROM tenant_a.orders GROUP BY id) SELECT * FROM a WHERE total > (SELECT avg(value) FROM tenant_a.orders)"},
		{"deep20", "SELECT * FROM " + strings.Repeat("(SELECT * FROM ", 20) + "tenant_a.orders" + strings.Repeat(") t", 20)},
		{"deep100", "SELECT * FROM " + strings.Repeat("(SELECT * FROM ", 100) + "tenant_a.orders" + strings.Repeat(") t", 100)},
	} {
		b.Run(query.name, func(b *testing.B) {
			for b.Loop() {
				if err := db.ValidateSQL(b.Context(), query.sql, ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
