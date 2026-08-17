package remoteread

var postgresFunctions = map[string]PathArguments{
	"read_postgres_binary": positionalPath(0),
}
