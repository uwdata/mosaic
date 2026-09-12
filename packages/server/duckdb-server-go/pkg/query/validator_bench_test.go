package query

import (
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset"
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

func BenchmarkValidateSQLParallel(b *testing.B) {
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
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			if err := db.ValidateSQL(b.Context(), "SELECT * FROM tenant_a.orders", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}); err != nil {
				b.Fatal(err)
			}
		}
	})
}

func BenchmarkValidateSQLPolicies(b *testing.B) {
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
	for _, test := range []struct {
		name, query string
		policy      ValidationPolicy
	}{
		{"allowlist", "SELECT id, sum(value), avg(value) FROM tenant_a.orders GROUP BY id", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}, CheckFunctions: true, AllowedFunctions: functionset.DefaultFunctions()}},
		{"blocklist", "SELECT id, sum(value), avg(value) FROM tenant_a.orders GROUP BY id", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}, BlockedFunctions: []string{"read_parquet", "read_csv", "query", "json_execute_serialized_sql"}}},
		{"remote", "SELECT * FROM read_parquet('local.parquet')", ValidationPolicy{RejectRemoteURILiterals: true}},
	} {
		b.Run(test.name, func(b *testing.B) {
			for b.Loop() {
				if err := db.ValidateSQL(b.Context(), test.query, test.policy); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
