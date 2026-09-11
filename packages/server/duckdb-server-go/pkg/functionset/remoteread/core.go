package remoteread

var coreFunctions = map[string]PathArguments{
	"glob":             positionalPath(0),
	"histogram":        positionalPath(0, "source"),
	"histogram_values": positionalPath(0, "source"),
	"query_table":      positionalPath(0),
	"read_blob":        positionalPath(0),
	"read_csv":         positionalPath(0),
	"read_csv_auto":    positionalPath(0),
	"read_duckdb":      positionalPath(0),
	"read_text":        positionalPath(0),
	"sniff_csv":        positionalPath(0),
}
