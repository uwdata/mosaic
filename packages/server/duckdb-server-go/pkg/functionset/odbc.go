package functionset

// Source: https://github.com/duckdb/odbc-scanner/tree/274a3307341dcafd62471c09b45c5d858d6c95cc
var odbcComputeFunctions = [...]string{}

var odbcElevatedFunctions = [...]string{
	"odbc_begin_transaction",
	"odbc_bind_params",
	"odbc_close",
	"odbc_commit",
	"odbc_connect",
	"odbc_copy",
	"odbc_create_params",
	"odbc_list_data_sources",
	"odbc_list_drivers",
	"odbc_query",
	"odbc_rollback",
}
