package query

import (
	"database/sql"
	"fmt"
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
)

func bootstrapExperiment(statement string) (string, string) {
	start := strings.Index(statement, "grammar(kind,")
	end := strings.Index(statement, "tree AS MATERIALIZED")
	grammar := strings.TrimSuffix(strings.TrimSpace(statement[start:end]), ",")
	setup := "CREATE TEMP TABLE cached_rules AS WITH " + grammar + " SELECT * FROM rules;" +
		"CREATE TEMP TABLE cached_expressions AS WITH " + grammar + " SELECT * FROM expression_grammar;" +
		"CREATE TEMP TABLE input(query VARCHAR, check_schemas BOOLEAN, allowed_schemas VARCHAR[], blocked_functions VARCHAR[], check_functions BOOLEAN, allowed_functions VARCHAR[], reject_remote_uris BOOLEAN, remote_readers JSON);" +
		"INSERT INTO input VALUES ('SELECT 1', false, [], [], false, [], false, '{}');"
	statement = statement[:start] + "rules AS (SELECT * FROM cached_rules), expression_grammar AS (SELECT * FROM cached_expressions), " + statement[end:]
	for _, name := range []string{"query", "check_schemas", "allowed_schemas", "blocked_functions", "check_functions", "allowed_functions", "reject_remote_uris", "remote_readers"} {
		statement = strings.ReplaceAll(statement, "$"+name, "(SELECT "+name+" FROM input)")
	}
	return setup, statement
}

func BenchmarkValidationBootstrap(b *testing.B) {
	for _, threads := range []int{1, 14} {
		for _, direct := range []bool{false, true} {
			b.Run(fmt.Sprintf("threads%d/direct%t", threads, direct), func(b *testing.B) {
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
				setup, statement := bootstrapExperiment(validationSQL)
				if _, err = conn.ExecContext(b.Context(), fmt.Sprintf("SET threads=%d;", threads)+setup); err != nil {
					b.Fatal(err)
				}
				if _, err = conn.ExecContext(b.Context(), "PREPARE validation AS "+statement); err != nil {
					b.Fatal(err)
				}
				update, err := conn.PrepareContext(b.Context(), "UPDATE input SET query=$1, check_schemas=$2, allowed_schemas=$3, blocked_functions=$4, check_functions=$5, allowed_functions=$6, reject_remote_uris=$7, remote_readers=$8")
				if err != nil {
					b.Fatal(err)
				}
				defer update.Close()
				if !direct {
					statement = "EXECUTE validation"
				}
				for b.Loop() {
					if _, err = update.ExecContext(b.Context(), "SELECT * FROM tenant_a.orders", true, []string{"tenant_a"}, []string{}, false, []string{}, false, remoteReadersJSON); err != nil {
						b.Fatal(err)
					}
					rows, err := conn.QueryContext(b.Context(), statement)
					if err != nil {
						b.Fatal(err)
					}
					for rows.Next() {
						var code, typ, sub, msg, pos string
						if err = rows.Scan(&code, &typ, &sub, &msg, &pos); err != nil {
							b.Fatal(err)
						}
						if code != "ok" {
							b.Fatal(code, msg)
						}
					}
					if err = rows.Err(); err != nil {
						b.Fatal(err)
					}
					rows.Close()
				}
			})
		}
	}
}
