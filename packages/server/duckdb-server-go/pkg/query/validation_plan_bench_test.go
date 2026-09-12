package query

import (
	"database/sql"
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
)

func validationPlanVariant(text, name string) string {
	if strings.Contains(name, "result_join") {
		start := strings.Index(text, "    UNION ALL\n    SELECT 'ok'")
		text = text[:start] + `
)
SELECT DISTINCT coalesce(code, 'ok') AS code, coalesce(error_type, '') AS error_type,
    coalesce(error_subtype, '') AS error_subtype, coalesce(message, '') AS message,
    coalesce(position, '') AS position
FROM (VALUES (1)) dummy(n) LEFT JOIN result ON true
ORDER BY code, message;`
	}
	if strings.Contains(name, "fields") {
		text = strings.Replace(text, "LEFT JOIN rules r ON r.kind = owner.kind", `LEFT JOIN cached_fields field ON field.kind = owner.kind AND field.name = CASE
            WHEN p.type = 'OBJECT' THEN t.key
            WHEN gp.type = 'OBJECT' THEN p.key
            ELSE gp.key END`, 1)
		for _, key := range []string{"t.key", "p.key", "gp.key"} {
			text = strings.ReplaceAll(text, "system.main.json_extract_string(r.fields, '/' || "+key+")", "field.expected")
		}
	}
	if strings.Contains(name, "specialized") {
		text = strings.ReplaceAll(text, "(SELECT check_schemas FROM input)", "true")
		text = strings.ReplaceAll(text, "(SELECT check_functions FROM input)", "false")
		text = strings.ReplaceAll(text, "(SELECT reject_remote_uris FROM input)", "false")
		text = strings.ReplaceAll(text, "(SELECT blocked_functions FROM input)", "[]::VARCHAR[]")
	}
	if strings.Contains(name, "input_scan") {
		for _, section := range []struct{ start, end string }{{"parsed AS MATERIALIZED (", "),\npolicy AS"}, {"policy AS (", "),\nrules AS"}} {
			start := strings.Index(text, section.start)
			end := start + strings.Index(text[start:], section.end)
			part := text[start:end]
			for _, column := range []string{"query", "check_schemas", "allowed_schemas", "blocked_functions", "check_functions", "allowed_functions", "reject_remote_uris", "remote_readers"} {
				part = strings.ReplaceAll(part, "(SELECT "+column+" FROM input)", column)
			}
			text = text[:start] + part + " FROM input\n" + text[end:]
		}
	}
	if strings.Contains(name, "tree_scalar") {
		text = strings.Replace(text, "SELECT t.* FROM parsed, system.main.json_tree(ast) t\n    WHERE (ast->>'error') = 'false'", "SELECT t.* FROM system.main.json_tree((SELECT ast FROM parsed WHERE (ast->>'error') = 'false')) t", 1)
	}
	return text
}

func BenchmarkValidationPlans(b *testing.B) {
	for _, variant := range []string{"baseline", "input_scan", "fields_input_scan", "result_join", "input_scan_result_join", "specialized_input_scan_tree_scalar", "batch", "execute_only"} {
		b.Run(variant, func(b *testing.B) {
			connector, err := duckdb.NewConnector(":memory:?threads=1", nil)
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
			setup, statement := bootstrapExperiment(validationSQL)
			statement = validationPlanVariant(statement, variant)
			if _, err = conn.ExecContext(b.Context(), setup); err != nil {
				b.Fatal(err)
			}
			if _, err = conn.ExecContext(b.Context(), "CREATE TEMP TABLE cached_fields AS SELECT kind, j.key AS name, j.value::VARCHAR AS raw, json_extract_string(j.value, '$') AS expected FROM cached_rules, json_each(fields) j"); err != nil {
				b.Fatal(err)
			}
			for _, optimizer := range []string{"join_order", "statistics_propagation", "deliminator"} {
				match := optimizer
				if optimizer == "statistics_propagation" {
					match = "statistics"
				}
				if strings.Contains(variant, "no_"+match) {
					if _, err = conn.ExecContext(b.Context(), "SET disabled_optimizers='"+optimizer+"'"); err != nil {
						b.Fatal(err)
					}
				}
			}
			if _, err = conn.ExecContext(b.Context(), "PREPARE validation AS "+statement); err != nil {
				b.Fatal(err)
			}
			if _, err = conn.ExecContext(b.Context(), "UPDATE input SET query='SELECT * FROM tenant_a.orders',check_schemas=true,allowed_schemas=['tenant_a']"); err != nil {
				b.Fatal(err)
			}
			for b.Loop() {
				if variant != "batch" && variant != "execute_only" {
					if _, err = conn.ExecContext(b.Context(), "UPDATE input SET query=$1,check_schemas=true,allowed_schemas=['tenant_a']", "SELECT * FROM tenant_a.orders"); err != nil {
						b.Fatal(err)
					}
				}
				command := "EXECUTE validation"
				if variant == "batch" {
					command = "UPDATE input SET query='SELECT * FROM tenant_a.orders',check_schemas=true,allowed_schemas=['tenant_a']; " + command
				}
				rows, err := conn.QueryContext(b.Context(), command)
				if err != nil {
					b.Fatal(err)
				}
				if err = readValidationResult(rows); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
