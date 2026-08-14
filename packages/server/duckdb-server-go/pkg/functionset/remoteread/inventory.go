package remoteread

import (
	"slices"
	"strings"
)

// PathArguments identifies arguments that can carry a URI or path.
type PathArguments struct {
	// Positional contains zero-based indexes among unnamed SQL arguments.
	Positional []int
	// Named contains lowercase DuckDB argument names.
	Named []string
}

type inventoryGroup struct {
	name      string
	functions map[string]PathArguments
}

var inventoryGroups = [...]inventoryGroup{
	{name: "avro", functions: avroFunctions},
	{name: "core", functions: coreFunctions},
	{name: "delta", functions: deltaFunctions},
	{name: "ducklake", functions: duckLakeFunctions},
	{name: "excel", functions: excelFunctions},
	{name: "iceberg", functions: icebergFunctions},
	{name: "json", functions: jsonFunctions},
	{name: "lance", functions: lanceFunctions},
	{name: "parquet", functions: parquetFunctions},
	{name: "postgres", functions: postgresFunctions},
	{name: "spatial", functions: spatialFunctions},
	{name: "sqlite", functions: sqliteFunctions},
	{name: "vortex", functions: vortexFunctions},
}

var inventory = mergeInventories(inventoryGroups[:])

// Lookup returns the reviewed path arguments for a function name.
func Lookup(name string) (PathArguments, bool) {
	arguments, ok := inventory[strings.ToLower(strings.TrimSpace(name))]
	if !ok {
		return PathArguments{}, false
	}
	return cloneArguments(arguments), true
}

// FunctionNames returns the sorted reviewed function names.
func FunctionNames() []string {
	names := make([]string, 0, len(inventory))
	for name := range inventory {
		names = append(names, name)
	}
	slices.Sort(names)
	return names
}

func positionalPath(index int, named ...string) PathArguments {
	return PathArguments{
		Positional: []int{index},
		Named:      named,
	}
}

func mergeInventories(groups []inventoryGroup) map[string]PathArguments {
	functions := make(map[string]PathArguments)
	for _, group := range groups {
		for name, arguments := range group.functions {
			if _, ok := functions[name]; ok {
				panic("duplicate remote-read function: " + name)
			}
			functions[name] = cloneArguments(arguments)
		}
	}
	return functions
}

func cloneArguments(arguments PathArguments) PathArguments {
	return PathArguments{
		Positional: slices.Clone(arguments.Positional),
		Named:      slices.Clone(arguments.Named),
	}
}
