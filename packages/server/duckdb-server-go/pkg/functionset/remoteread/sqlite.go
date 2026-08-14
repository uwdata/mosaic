package remoteread

var sqliteFunctions = map[string]PathArguments{
	"sqlite_attach": positionalPath(0),
	"sqlite_scan":   positionalPath(0),
}
