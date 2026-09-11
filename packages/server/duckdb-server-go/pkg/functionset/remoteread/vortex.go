package remoteread

var vortexFunctions = map[string]PathArguments{
	"read_vortex": positionalPath(0),
	"vortex_scan": positionalPath(0),
}
