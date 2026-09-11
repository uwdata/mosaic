package functionset

// Source: https://github.com/duckdb/duckdb-quack/tree/c1548111c1bfd16207e22fd3cb7e4bde1335b9d0
var quackComputeFunctions = [...]string{
	"quack_check_token",
	"quack_nop_authorization",
	"quack_uri_parser",
}

var quackElevatedFunctions = [...]string{
	"quack_active_connections",
	"quack_clear_cache",
	"quack_identify",
	"quack_query",
	"quack_query_by_name",
	"quack_serve",
	"quack_server_list",
	"quack_stop",
	"whoami",
}
