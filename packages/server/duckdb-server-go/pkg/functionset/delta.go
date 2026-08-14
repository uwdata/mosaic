package functionset

// Source: https://github.com/duckdb/duckdb-delta/tree/45c40878601b54b4188b09e08732fe0d576ad222
var deltaComputeFunctions = [...]string{
	"get_delta_test_expression",
	"parse_delta_filter_logline",
}

var deltaElevatedFunctions = [...]string{
	"copy_dir",
	"delta_domain_metadata",
	"delta_filter_pushdown_log",
	"delta_filter_pushdown_log_tpcds",
	"delta_get_transaction_version",
	"delta_list_files",
	"delta_scan",
	"delta_set_transaction_version",
	"write_blob",
}
