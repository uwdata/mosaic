package functionset

import (
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCoreExtensions(t *testing.T) {
	expected := []ExtensionFunctions{
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

	got := CoreExtensions()
	assert.Equal(t, expected, got)
	assert.Len(t, extensionFunctionInventories, len(expected))
	for _, extension := range got {
		_, ok := extensionFunctionInventories[extension]
		assert.True(t, ok, string(extension))
	}

	got[0] = "mutated"
	assert.Equal(t, Autocomplete, CoreExtensions()[0])
}

func TestEmptyExtensionFunctionInventories(t *testing.T) {
	for _, extension := range []ExtensionFunctions{Azure, Encodings, HTTPFS} {
		assert.NotNil(t, extension.Compute(), string(extension))
		assert.Empty(t, extension.Compute(), string(extension))
		assert.NotNil(t, extension.Elevated(), string(extension))
		assert.Empty(t, extension.Elevated(), string(extension))
		assert.NotNil(t, extension.All(), string(extension))
		assert.Empty(t, extension.All(), string(extension))
	}
}

func TestExtensionFunctionInventories(t *testing.T) {
	tests := []struct {
		name             string
		extension        ExtensionFunctions
		computeCount     int
		elevatedCount    int
		computeContains  []string
		elevatedContains []string
	}{
		{
			name:             "spatial",
			extension:        Spatial,
			computeCount:     151,
			elevatedCount:    13,
			computeContains:  []string{"st_asgeojson", "st_centroid", "st_x", "st_y"},
			elevatedContains: []string{"rtree_index_scan", "st_generatepoints", "st_read", "st_transform"},
		},
		{
			name:             "parquet",
			extension:        Parquet,
			computeCount:     2,
			elevatedCount:    9,
			computeContains:  []string{"variant_bytes_to_variant", "variant_to_parquet_variant"},
			elevatedContains: []string{"add_parquet_key", "parquet_metadata", "parquet_scan", "read_parquet"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			compute := tt.extension.Compute()
			elevated := tt.extension.Elevated()
			all := tt.extension.All()

			require.Len(t, compute, tt.computeCount)
			require.Len(t, elevated, tt.elevatedCount)
			require.Len(t, all, tt.computeCount+tt.elevatedCount)
			assertFunctionInventory(t, compute)
			assertFunctionInventory(t, elevated)
			assertFunctionInventory(t, all)
			assert.Equal(t, extensionFunctionNames(compute, elevated), all)

			for _, function := range compute {
				assert.NotContains(t, elevated, function)
			}
			for _, function := range tt.computeContains {
				assert.Contains(t, compute, function)
				assert.Contains(t, all, function)
			}
			for _, function := range tt.elevatedContains {
				assert.Contains(t, elevated, function)
				assert.Contains(t, all, function)
			}

			compute[0] = "mutated"
			elevated[0] = "mutated"
			all[0] = "mutated"
			assert.NotContains(t, tt.extension.Compute(), "mutated")
			assert.NotContains(t, tt.extension.Elevated(), "mutated")
			assert.NotContains(t, tt.extension.All(), "mutated")
		})
	}
}

func TestCoreExtensionPolicies(t *testing.T) {
	defaults := DefaultFunctions()
	for _, extension := range CoreExtensions() {
		t.Run(string(extension), func(t *testing.T) {
			compute := extension.Compute()
			elevated := extension.Elevated()
			all := extension.All()

			assertFunctionInventory(t, compute)
			assertFunctionInventory(t, elevated)
			assertFunctionInventory(t, all)
			assert.Equal(t, extensionFunctionNames(compute, elevated), all)

			for _, function := range compute {
				assert.Contains(t, defaults, function)
				assert.NotContains(t, elevated, function)
			}
			for _, function := range elevated {
				assert.NotContains(t, defaults, function)
			}
		})
	}
}

func TestUnknownExtensionFunctions(t *testing.T) {
	extension := ExtensionFunctions("unknown")
	assert.NotNil(t, extension.Compute())
	assert.Empty(t, extension.Compute())
	assert.NotNil(t, extension.Elevated())
	assert.Empty(t, extension.Elevated())
	assert.NotNil(t, extension.All())
	assert.Empty(t, extension.All())
}

func assertFunctionInventory(t *testing.T, functions []string) {
	t.Helper()
	assert.True(t, slices.IsSorted(functions))
	assert.Equal(t, len(functions), len(slices.Compact(slices.Clone(functions))))
}
