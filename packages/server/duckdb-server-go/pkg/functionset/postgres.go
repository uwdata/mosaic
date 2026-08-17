package functionset

// Source: https://github.com/duckdb/duckdb-postgres/tree/41223e51559cd581f1c06e170b71c71df25bbaac
var postgresComputeFunctions = [...]string{
	"postgres_hstore_get",
	"postgres_hstore_to_json",
}

var postgresElevatedFunctions = [...]string{
	"pg_clear_cache",
	"postgres_attach",
	"postgres_configure_pool",
	"postgres_execute",
	"postgres_query",
	"postgres_scan",
	"postgres_scan_pushdown",
	"read_postgres_binary",
}
