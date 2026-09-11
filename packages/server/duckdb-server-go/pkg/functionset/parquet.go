package functionset

// Source: https://github.com/duckdb/duckdb/tree/d8cdaa33fda8df955cc76ef58a280f68f4cd43fa/extension/parquet
var parquetComputeFunctions = [...]string{
	"variant_bytes_to_variant",
	"variant_to_parquet_variant",
}

var parquetElevatedFunctions = [...]string{
	"add_parquet_key",
	"parquet_bloom_probe",
	"parquet_file_metadata",
	"parquet_full_metadata",
	"parquet_kv_metadata",
	"parquet_metadata",
	"parquet_scan",
	"parquet_schema",
	"read_parquet",
}
