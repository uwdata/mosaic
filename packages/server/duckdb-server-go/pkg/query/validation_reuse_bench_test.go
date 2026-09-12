package query

import (
	"database/sql"
	"fmt"
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
)

func BenchmarkValidationReuse(b *testing.B) {
	for _, threads := range []int{14, 1} {
		for _, input := range []string{"native", "fixed_ast"} {
			for _, mode := range []string{"direct", "prepared", "prepared_nil_lists"} {
				b.Run(fmt.Sprintf("threads%d/%s/%s", threads, input, mode), func(b *testing.B) {
					connector, err := duckdb.NewConnector(":memory:", nil)
					if err != nil {
						b.Fatal(err)
					}
					defer connector.Close()
					db := sql.OpenDB(connector)
					defer db.Close()
					conn, err := db.Conn(b.Context())
					if err != nil {
						b.Fatal(err)
					}
					defer conn.Close()
					if _, err = conn.ExecContext(b.Context(), fmt.Sprintf("SET threads=%d", threads)); err != nil {
						b.Fatal(err)
					}
					text := validationSQL
					inputText := "SELECT * FROM tenant_a.orders"
					if input == "fixed_ast" {
						var ast string
						err = conn.QueryRowContext(b.Context(), "SELECT system.main.json_serialize_sql('SELECT * FROM tenant_a.orders', skip_default := true, skip_empty := true, skip_null := true)::VARCHAR").Scan(&ast)
						if err != nil {
							b.Fatal(err)
						}
						start := strings.Index(text, "system.main.json_serialize_sql(")
						end := start + strings.Index(text[start:], ") AS ast") + 1
						text = text[:start] + "$query::JSON" + text[end:]
						inputText = ast
					}
					args := []any{sql.Named("query", inputText), sql.Named("check_schemas", true), sql.Named("allowed_schemas", []string{"tenant_a"}), sql.Named("blocked_functions", []string{}), sql.Named("check_functions", false), sql.Named("allowed_functions", []string{}), sql.Named("reject_remote_uris", false), sql.Named("remote_readers", "{}")}
					if mode == "prepared_nil_lists" {
						args[3] = sql.Named("blocked_functions", []string(nil))
						args[5] = sql.Named("allowed_functions", []string(nil))
					}
					var stmt *sql.Stmt
					if mode != "direct" {
						stmt, err = conn.PrepareContext(b.Context(), text)
						if err != nil {
							b.Fatal(err)
						}
						defer stmt.Close()
					}
					for b.Loop() {
						var rows *sql.Rows
						if mode != "direct" {
							rows, err = stmt.QueryContext(b.Context(), args...)
						} else {
							rows, err = conn.QueryContext(b.Context(), text, args...)
						}
						if err != nil {
							b.Fatal(err)
						}
						count := 0
						for rows.Next() {
							var code, typ, subtype, message, position string
							if err = rows.Scan(&code, &typ, &subtype, &message, &position); err != nil {
								b.Fatal(err)
							}
							if code != "ok" {
								b.Fatal(code, message)
							}
							count++
						}
						if err = rows.Err(); err != nil {
							b.Fatal(err)
						}
						rows.Close()
						if count != 1 {
							b.Fatal(count)
						}
					}
				})
			}
		}
	}
}
