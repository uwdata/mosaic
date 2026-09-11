package functionset

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
