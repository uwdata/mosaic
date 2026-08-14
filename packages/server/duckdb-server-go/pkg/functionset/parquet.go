package functionset

// These names match the Parquet extension bundled with DuckDB 1.5.5.
var parquetFunctions = [...]string{
	"parquet_bloom_probe",
	"parquet_file_metadata",
	"parquet_full_metadata",
	"parquet_kv_metadata",
	"parquet_metadata",
	"parquet_scan",
	"parquet_schema",
	"read_parquet",
	"variant_bytes_to_variant",
	"variant_to_parquet_variant",
}

// Parquet returns function names registered by the Parquet extension bundled with DuckDB 1.5.5.
// It includes file-reading functions and does not cover COPY or replacement scans.
func Parquet() []string {
	return functionNames(parquetFunctions[:])
}
