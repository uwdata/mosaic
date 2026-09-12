package query

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"

	"github.com/duckdb/duckdb-go/v2"
)

func validationBootstrap() string {
	start := strings.Index(validationSQL, "grammar(kind,")
	end := strings.Index(validationSQL, "tree AS MATERIALIZED")
	grammar := strings.TrimSuffix(strings.TrimSpace(validationSQL[start:end]), ",")
	setup := "CREATE TEMP TABLE validation_rules AS WITH " + grammar + " SELECT * FROM rules;" +
		"CREATE TEMP TABLE validation_expressions AS WITH " + grammar + " SELECT * FROM expression_grammar;" +
		"CREATE TEMP TABLE validation_input(query VARCHAR, check_schemas BOOLEAN, allowed_schemas VARCHAR[], blocked_functions VARCHAR[], check_functions BOOLEAN, allowed_functions VARCHAR[], reject_remote_uris BOOLEAN, remote_readers JSON);" +
		"INSERT INTO validation_input VALUES ('SELECT 1', false, [], [], false, [], false, " + quoteLiteral(remoteReadersJSON) + ");"
	statement := validationSQL[:start] + "rules AS (SELECT * FROM temp.main.validation_rules), expression_grammar AS (SELECT * FROM temp.main.validation_expressions), " + validationSQL[end:]
	inputEnd := strings.Index(statement, "rules AS (")
	input := statement[:inputEnd]
	for _, name := range []string{"query", "check_schemas", "allowed_schemas", "blocked_functions", "check_functions", "allowed_functions", "reject_remote_uris", "remote_readers"} {
		input = strings.ReplaceAll(input, "$"+name, name)
	}
	input = strings.ReplaceAll(input, "\n),", "\n    FROM temp.main.validation_input\n),")
	statement = input + statement[inputEnd:]
	return setup + "PREPARE validation AS " + statement
}

func newValidationDB(ctx context.Context, maxConnections int) (*sql.DB, error) {
	bootstrap := validationBootstrap()
	connector, err := duckdb.NewConnector(":memory:?threads=1", func(execer driver.ExecerContext) error {
		_, err := execer.ExecContext(context.Background(), bootstrap, nil)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("query: failed to open validation database: %w", err)
	}
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(maxConnections)
	db.SetMaxIdleConns(maxConnections)
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("query: failed to initialize validation database: %w", err)
	}
	return db, nil
}

func (db *DB) validatePrepared(ctx context.Context, query string, policy ValidationPolicy) error {
	conn, err := db.validationDB.Conn(ctx)
	if err != nil {
		return fmt.Errorf("query: failed to acquire validation connection: %w", err)
	}
	defer conn.Close()
	_, err = conn.ExecContext(ctx, `UPDATE temp.main.validation_input SET
		query=$1, check_schemas=$2, allowed_schemas=$3, blocked_functions=$4,
		check_functions=$5, allowed_functions=$6, reject_remote_uris=$7`,
		query, policy.CheckSchemas, policy.AllowedSchemas, policy.BlockedFunctions,
		policy.CheckFunctions, policy.AllowedFunctions, policy.RejectRemoteURILiterals)
	if err != nil {
		return fmt.Errorf("query: failed to set validation input: %w", err)
	}
	rows, err := conn.QueryContext(ctx, "EXECUTE validation")
	if err != nil {
		return fmt.Errorf("query: failed to validate SQL: %w", err)
	}
	return readValidationResult(rows)
}
