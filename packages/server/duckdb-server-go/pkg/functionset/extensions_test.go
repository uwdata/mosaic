package functionset

import (
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExtensionFunctionInventories(t *testing.T) {
	tests := []struct {
		name      string
		functions func() []string
		count     int
		contains  []string
	}{
		{
			name:      "spatial",
			functions: Spatial,
			count:     164,
			contains:  []string{"st_asgeojson", "st_centroid", "st_read", "st_transform", "st_x", "st_y"},
		},
		{
			name:      "parquet",
			functions: Parquet,
			count:     10,
			contains:  []string{"parquet_metadata", "parquet_scan", "read_parquet"},
		},
	}

	defaults := DefaultFunctions()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			functions := tt.functions()
			require.Len(t, functions, tt.count)
			assert.True(t, slices.IsSorted(functions))
			assert.Equal(t, len(functions), len(slices.Compact(slices.Clone(functions))))
			for _, function := range tt.contains {
				assert.Contains(t, functions, function)
			}
			for _, function := range functions {
				assert.NotContains(t, defaults, function)
			}

			first := functions[0]
			functions[0] = "mutated"
			assert.Equal(t, first, tt.functions()[0])
		})
	}
}
