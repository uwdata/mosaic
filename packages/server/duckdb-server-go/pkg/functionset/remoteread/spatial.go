package remoteread

var spatialFunctions = map[string]PathArguments{
	"shapefile_meta": positionalPath(0),
	"st_read":        positionalPath(0, "sibling_files"),
	"st_read_meta":   positionalPath(0),
	"st_readosm":     positionalPath(0),
	"st_readshp":     positionalPath(0),
}
