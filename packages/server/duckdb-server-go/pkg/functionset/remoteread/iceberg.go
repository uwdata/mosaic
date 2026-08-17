package remoteread

var icebergFunctions = map[string]PathArguments{
	"iceberg_column_stats":    positionalPath(0),
	"iceberg_metadata":        positionalPath(0),
	"iceberg_partition_stats": positionalPath(0),
	"iceberg_scan":            positionalPath(0),
	"iceberg_snapshots":       positionalPath(0),
}
