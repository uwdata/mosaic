package functionset

// Source: https://github.com/duckdb/duckdb-avro/tree/f9d590297485f0318f480372c70bdd852826e258
var avroComputeFunctions = [...]string{}

var avroElevatedFunctions = [...]string{
	"read_avro",
}

// Source: https://github.com/duckdb/duckdb-aws/tree/efa54a990e16c976576685dd4134d2478cf5a574
var awsComputeFunctions = [...]string{}

var awsElevatedFunctions = [...]string{
	"load_aws_credentials",
}

// Source: https://github.com/duckdb/duckdb-azure/tree/003214c96d0caa39d5c3e27a9e1976a0692c7d37
var azureComputeFunctions = [...]string{}

var azureElevatedFunctions = [...]string{}

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

// Source: https://github.com/duckdb/ducklake/tree/d8a1881e22516ea3d186d73e83c65fe5bd1a1dc4
var duckLakeComputeFunctions = [...]string{
	"murmur3_32",
}

var duckLakeElevatedFunctions = [...]string{
	"ducklake_add_data_files",
	"ducklake_cleanup_old_files",
	"ducklake_commit",
	"ducklake_current_snapshot",
	"ducklake_delete_orphaned_files",
	"ducklake_expire_snapshots",
	"ducklake_flush_inlined_data",
	"ducklake_last_committed_snapshot",
	"ducklake_list_files",
	"ducklake_merge_adjacent_files",
	"ducklake_options",
	"ducklake_rewrite_data_files",
	"ducklake_scan",
	"ducklake_set_commit_message",
	"ducklake_set_option",
	"ducklake_settings",
	"ducklake_snapshots",
	"ducklake_table_changes",
	"ducklake_table_deletions",
	"ducklake_table_info",
	"ducklake_table_insertions",
}

// Source: https://github.com/duckdb/duckdb-encodings/tree/06295e77b13de65842992c82f14289ea679e4730
var encodingsComputeFunctions = [...]string{}

var encodingsElevatedFunctions = [...]string{}

// Source: https://github.com/duckdb/duckdb-excel/tree/f4c72b5ef04a03b3a78a95b5a2ee94ba93e3178d
var excelComputeFunctions = [...]string{
	"excel_text",
	"text",
}

var excelElevatedFunctions = [...]string{
	"read_xlsx",
}

// Source: https://github.com/duckdb/duckdb-fts/tree/6814ec9a7d5fd63500176507262b0dbf7cea0095
var ftsComputeFunctions = [...]string{
	"stem",
}

var ftsElevatedFunctions = [...]string{
	"create_fts_index",
	"drop_fts_index",
}

// Source: https://github.com/duckdb/duckdb-httpfs/tree/827222fb45a043a7a852d1f7aae46901492a3cda
var httpfsComputeFunctions = [...]string{}

var httpfsElevatedFunctions = [...]string{}

// Source: https://github.com/duckdb/duckdb-iceberg/tree/45163a28e0ed6a2071a82a1bf1dd432d0216cf9c
var icebergComputeFunctions = [...]string{
	"iceberg_bucket",
	"iceberg_truncate",
}

var icebergElevatedFunctions = [...]string{
	"iceberg_column_stats",
	"iceberg_load_table_response",
	"iceberg_metadata",
	"iceberg_partition_stats",
	"iceberg_scan",
	"iceberg_schema_properties",
	"iceberg_snapshots",
	"iceberg_table_properties",
	"iceberg_to_ducklake",
	"iceberg_verify_equality_deletes",
	"remove_iceberg_schema_properties",
	"remove_iceberg_table_properties",
	"set_iceberg_schema_properties",
	"set_iceberg_table_properties",
}

// Source: https://github.com/duckdb/duckdb-inet/tree/fe7f60bb60245197680fb07ecd1629a1dc3d91c8
var inetComputeFunctions = [...]string{
	"+",
	"-",
	"<<=",
	">>=",
	"broadcast",
	"family",
	"host",
	"html_escape",
	"html_unescape",
	"netmask",
	"network",
}

var inetElevatedFunctions = [...]string{}

// Source: https://github.com/lance-format/lance-duckdb/tree/2f167ea1aa8b1201c89d53740b84deb00aff680e
var lanceComputeFunctions = [...]string{}

var lanceElevatedFunctions = [...]string{
	"__lance_cleanup_old_versions",
	"__lance_compact_files",
	"__lance_exec",
	"__lance_namespace_scan",
	"__lance_optimize_index",
	"__lance_scan",
	"__lance_set_auto_cleanup",
	"__lance_show_auto_cleanup",
	"__lance_truncate_table",
	"lance_fts",
	"lance_hybrid_search",
	"lance_vector_search",
}

// Source: https://github.com/duckdb/duckdb-mysql/tree/7267164dab3409e943261aeee6ae32f1b00847a7
var mysqlComputeFunctions = [...]string{}

var mysqlElevatedFunctions = [...]string{
	"mysql_clear_cache",
	"mysql_debug_execution_plan",
	"mysql_execute",
	"mysql_explain_federated",
	"mysql_query",
}

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

// Source: https://github.com/duckdb/duckdb-sqlite/tree/f79b1db7d7730b18d0f8400d3650ffa6b45168d8
var sqliteComputeFunctions = [...]string{}

var sqliteElevatedFunctions = [...]string{
	"sqlite_attach",
	"sqlite_query",
	"sqlite_scan",
}

// Source: https://github.com/duckdb/duckdb-ui/tree/26084e6e02cc7f47ba0361daef646d75974908d9
var uiComputeFunctions = [...]string{}

var uiElevatedFunctions = [...]string{
	"start_ui",
	"start_ui_server",
	"stop_ui_server",
	"ui_is_started",
}

// Source: https://github.com/duckdb/unity_catalog/tree/fd851475780ca064d9706a5025ea6e5d1d9d7e23
var unityCatalogComputeFunctions = [...]string{}

var unityCatalogElevatedFunctions = [...]string{
	"__internal_delta_ccv2_commit_staged",
	"table_data_path",
	"unity_catalog_checkpoint_table",
	"unity_catalog_force_checkpoint_table",
}

// DuckDB pins https://github.com/vortex-data/duckdb-vortex/tree/2a008b1734d563f46a1ff0af3a758f4fd844ea91,
// whose lockfile pins https://github.com/vortex-data/vortex/tree/b68abbb68427ed545dbd18ee3b383f78d9c34d43/vortex-duckdb.
var vortexComputeFunctions = [...]string{}

var vortexElevatedFunctions = [...]string{
	"read_vortex",
	"vortex_scan",
}

// Source: https://github.com/duckdb/duckdb-vss/tree/b833341c8737fd3f3558c7720cc575ae8fc82598
var vssComputeFunctions = [...]string{}

var vssElevatedFunctions = [...]string{
	"hnsw_compact_index",
	"hnsw_index_scan",
	"pragma_hnsw_index_info",
	"vss_join",
	"vss_match",
}
