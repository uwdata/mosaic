package functionset

import (
	"slices"
	"testing"
)

func TestExtensionInventoryData(t *testing.T) {
	tests := []struct {
		name          string
		compute       []string
		elevated      []string
		computeCount  int
		elevatedCount int
	}{
		{"autocomplete", autocompleteComputeFunctions[:], autocompleteElevatedFunctions[:], 1, 3},
		{"avro", avroComputeFunctions[:], avroElevatedFunctions[:], 0, 1},
		{"aws", awsComputeFunctions[:], awsElevatedFunctions[:], 0, 1},
		{"azure", azureComputeFunctions[:], azureElevatedFunctions[:], 0, 0},
		{"delta", deltaComputeFunctions[:], deltaElevatedFunctions[:], 2, 9},
		{"ducklake", duckLakeComputeFunctions[:], duckLakeElevatedFunctions[:], 1, 21},
		{"encodings", encodingsComputeFunctions[:], encodingsElevatedFunctions[:], 0, 0},
		{"excel", excelComputeFunctions[:], excelElevatedFunctions[:], 2, 1},
		{"fts", ftsComputeFunctions[:], ftsElevatedFunctions[:], 1, 2},
		{"httpfs", httpfsComputeFunctions[:], httpfsElevatedFunctions[:], 0, 0},
		{"iceberg", icebergComputeFunctions[:], icebergElevatedFunctions[:], 2, 14},
		{"icu", icuComputeFunctions[:], icuElevatedFunctions[:], 179, 7},
		{"inet", inetComputeFunctions[:], inetElevatedFunctions[:], 11, 0},
		{"json", jsonComputeFunctions[:], jsonElevatedFunctions[:], 33, 9},
		{"lance", lanceComputeFunctions[:], lanceElevatedFunctions[:], 0, 12},
		{"motherduck", motherDuckComputeFunctions[:], motherDuckElevatedFunctions[:], 0, 198},
		{"mysql", mysqlComputeFunctions[:], mysqlElevatedFunctions[:], 0, 5},
		{"odbc", odbcComputeFunctions[:], odbcElevatedFunctions[:], 0, 11},
		{"postgres", postgresComputeFunctions[:], postgresElevatedFunctions[:], 2, 8},
		{"quack", quackComputeFunctions[:], quackElevatedFunctions[:], 3, 9},
		{"sqlite", sqliteComputeFunctions[:], sqliteElevatedFunctions[:], 0, 3},
		{"tpcds", tpcdsComputeFunctions[:], tpcdsElevatedFunctions[:], 2, 2},
		{"tpch", tpchComputeFunctions[:], tpchElevatedFunctions[:], 2, 2},
		{"ui", uiComputeFunctions[:], uiElevatedFunctions[:], 0, 5},
		{"unity_catalog", unityCatalogComputeFunctions[:], unityCatalogElevatedFunctions[:], 0, 4},
		{"vortex", vortexComputeFunctions[:], vortexElevatedFunctions[:], 0, 2},
		{"vss", vssComputeFunctions[:], vssElevatedFunctions[:], 0, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if len(tt.compute) != tt.computeCount {
				t.Fatalf("compute count = %d, want %d", len(tt.compute), tt.computeCount)
			}
			if len(tt.elevated) != tt.elevatedCount {
				t.Fatalf("elevated count = %d, want %d", len(tt.elevated), tt.elevatedCount)
			}
			assertRawExtensionInventory(t, tt.compute)
			assertRawExtensionInventory(t, tt.elevated)
			for _, name := range tt.compute {
				if slices.Contains(tt.elevated, name) {
					t.Errorf("%q appears in both inventories", name)
				}
			}
		})
	}
}

func assertRawExtensionInventory(t *testing.T, functions []string) {
	t.Helper()
	if !slices.IsSorted(functions) {
		t.Error("inventory is not sorted")
	}
	if len(functions) != len(slices.Compact(slices.Clone(functions))) {
		t.Error("inventory contains duplicate names")
	}
}
