package remoteread

var parquetFunctions = map[string]PathArguments{
	"parquet_bloom_probe":   positionalPath(0),
	"parquet_file_metadata": positionalPath(0),
	"parquet_full_metadata": positionalPath(0),
	"parquet_kv_metadata":   positionalPath(0),
	"parquet_metadata":      positionalPath(0),
	"parquet_scan":          positionalPath(0),
	"parquet_schema":        positionalPath(0),
	"read_parquet":          positionalPath(0),
}
