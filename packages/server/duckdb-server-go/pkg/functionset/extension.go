package functionset

// ExtensionFunctions identifies a reviewed DuckDB core-extension function inventory.
type ExtensionFunctions string

// Reviewed core extensions in DuckDB 1.5.5.
const (
	Autocomplete ExtensionFunctions = "autocomplete"
	Avro         ExtensionFunctions = "avro"
	AWS          ExtensionFunctions = "aws"
	Azure        ExtensionFunctions = "azure"
	Delta        ExtensionFunctions = "delta"
	DuckLake     ExtensionFunctions = "ducklake"
	Encodings    ExtensionFunctions = "encodings"
	Excel        ExtensionFunctions = "excel"
	FTS          ExtensionFunctions = "fts"
	HTTPFS       ExtensionFunctions = "httpfs"
	Iceberg      ExtensionFunctions = "iceberg"
	ICU          ExtensionFunctions = "icu"
	Inet         ExtensionFunctions = "inet"
	JSON         ExtensionFunctions = "json"
	Lance        ExtensionFunctions = "lance"
	MotherDuck   ExtensionFunctions = "motherduck"
	MySQL        ExtensionFunctions = "mysql"
	ODBC         ExtensionFunctions = "odbc"
	Parquet      ExtensionFunctions = "parquet"
	Postgres     ExtensionFunctions = "postgres"
	Quack        ExtensionFunctions = "quack"
	Spatial      ExtensionFunctions = "spatial"
	SQLite       ExtensionFunctions = "sqlite"
	TPCDS        ExtensionFunctions = "tpcds"
	TPCH         ExtensionFunctions = "tpch"
	UI           ExtensionFunctions = "ui"
	UnityCatalog ExtensionFunctions = "unity_catalog"
	Vortex       ExtensionFunctions = "vortex"
	VSS          ExtensionFunctions = "vss"
)

type extensionFunctionInventory struct {
	compute  []string
	elevated []string
}

var coreExtensions = [...]ExtensionFunctions{
	Autocomplete,
	Avro,
	AWS,
	Azure,
	Delta,
	DuckLake,
	Encodings,
	Excel,
	FTS,
	HTTPFS,
	Iceberg,
	ICU,
	Inet,
	JSON,
	Lance,
	MotherDuck,
	MySQL,
	ODBC,
	Parquet,
	Postgres,
	Quack,
	Spatial,
	SQLite,
	TPCDS,
	TPCH,
	UI,
	UnityCatalog,
	Vortex,
	VSS,
}

var extensionFunctionInventories = map[ExtensionFunctions]extensionFunctionInventory{
	Autocomplete: {},
	Avro:         {},
	AWS:          {},
	Azure:        {},
	Delta:        {},
	DuckLake:     {},
	Encodings:    {},
	Excel:        {},
	FTS:          {},
	HTTPFS:       {},
	Iceberg:      {},
	ICU:          {},
	Inet:         {},
	JSON:         {},
	Lance:        {},
	MotherDuck:   {},
	MySQL:        {},
	ODBC:         {},
	Parquet: {
		compute:  parquetComputeFunctions[:],
		elevated: parquetElevatedFunctions[:],
	},
	Postgres: {},
	Quack:    {},
	Spatial: {
		compute:  spatialComputeFunctions[:],
		elevated: spatialElevatedFunctions[:],
	},
	SQLite:       {},
	TPCDS:        {},
	TPCH:         {},
	UI:           {},
	UnityCatalog: {},
	Vortex:       {},
	VSS:          {},
}

// Compute returns the function names admitted by the default policy.
func (e ExtensionFunctions) Compute() []string {
	return extensionFunctionNames(extensionFunctionInventories[e].compute)
}

// Elevated returns the function names that require explicit policy admission.
func (e ExtensionFunctions) Elevated() []string {
	return extensionFunctionNames(extensionFunctionInventories[e].elevated)
}

// All returns all reviewed function names for the extension.
func (e ExtensionFunctions) All() []string {
	inventory := extensionFunctionInventories[e]
	return extensionFunctionNames(inventory.compute, inventory.elevated)
}

// CoreExtensions returns the reviewed core-extension inventories.
func CoreExtensions() []ExtensionFunctions {
	return append([]ExtensionFunctions{}, coreExtensions[:]...)
}

func extensionFunctionNames(groups ...[]string) []string {
	functions := functionNames(groups...)
	if functions == nil {
		return []string{}
	}
	return functions
}
