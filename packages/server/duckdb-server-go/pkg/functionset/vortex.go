package functionset

// DuckDB pins https://github.com/vortex-data/duckdb-vortex/tree/2a008b1734d563f46a1ff0af3a758f4fd844ea91,
// whose lockfile pins https://github.com/vortex-data/vortex/tree/b68abbb68427ed545dbd18ee3b383f78d9c34d43/vortex-duckdb.
var vortexComputeFunctions = [...]string{}

var vortexElevatedFunctions = [...]string{
	"read_vortex",
	"vortex_scan",
}
