package remoteread

var jsonFunctions = map[string]PathArguments{
	"read_json":              positionalPath(0),
	"read_json_auto":         positionalPath(0),
	"read_json_objects":      positionalPath(0),
	"read_json_objects_auto": positionalPath(0),
	"read_ndjson":            positionalPath(0),
	"read_ndjson_auto":       positionalPath(0),
	"read_ndjson_objects":    positionalPath(0),
}
