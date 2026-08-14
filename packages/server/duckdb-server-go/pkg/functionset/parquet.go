package functionset

// These groups partition the Parquet extension bundled with DuckDB 1.5.5.
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
