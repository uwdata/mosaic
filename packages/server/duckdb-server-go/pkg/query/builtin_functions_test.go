package query

import (
	"database/sql"
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuiltinFunctionInventories(t *testing.T) {
	tests := []struct {
		name       string
		functions  func() []string
		contains   []string
		notContain []string
	}{
		{
			name:       "operators",
			functions:  BuiltinOperators,
			contains:   []string{"!__postfix", "+", "&&", "@", "^", "~", "||"},
			notContain: []string{"@-", "sum"},
		},
		{
			name:       "aggregates",
			functions:  BuiltinAggregates,
			contains:   []string{"avg", "count_star", "geomean", "geometric_mean", "histogram_exact", "sum"},
			notContain: []string{"histogram", "list_aggregate", "row_number"},
		},
		{
			name:       "windows",
			functions:  BuiltinWindows,
			contains:   []string{"lag", "rank", "row_number"},
			notContain: []string{"sum"},
		},
		{
			name:       "syntax helpers",
			functions:  BuiltinSyntaxHelpers,
			contains:   []string{"date_part", "list_value", "struct_pack", "to_days"},
			notContain: []string{"json_deserialize_sql", "query"},
		},
		{
			name:       "table generators",
			functions:  BuiltinTableGenerators,
			contains:   []string{"generate_series", "range", "unnest"},
			notContain: []string{"glob", "read_parquet"},
		},
		{
			name:       "common scalars",
			functions:  CommonScalarFunctions,
			contains:   []string{"abs", "date_trunc", "json_extract", "list_transform", "lower"},
			notContain: []string{"current_setting", "getenv", "list_aggregate", "random"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			functions := tt.functions()
			require.NotEmpty(t, functions)
			assert.True(t, slices.IsSorted(functions))
			assert.Equal(t, len(functions), len(slices.Compact(slices.Clone(functions))))

			for _, function := range tt.contains {
				assert.Contains(t, functions, function)
			}
			for _, function := range tt.notContain {
				assert.NotContains(t, functions, function)
			}

			first := functions[0]
			functions[0] = "mutated"
			assert.Equal(t, first, tt.functions()[0])
		})
	}
}

func TestDefaultFunctionsMatchDuckDBCatalog(t *testing.T) {
	type catalogEntry struct {
		functionType string
		internal     bool
		sideEffects  sql.NullBool
		stability    sql.NullString
	}

	db := setupTestDB(t)
	rows, err := db.db.QueryContext(t.Context(), `
		SELECT DISTINCT
			lower(function_name),
			function_type,
			internal,
			has_side_effects,
			stability
		FROM duckdb_functions()
	`)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, rows.Close()) })

	catalog := make(map[string][]catalogEntry)
	for rows.Next() {
		var name string
		var entry catalogEntry
		require.NoError(t, rows.Scan(
			&name,
			&entry.functionType,
			&entry.internal,
			&entry.sideEffects,
			&entry.stability,
		))
		catalog[name] = append(catalog[name], entry)
	}
	require.NoError(t, rows.Err())

	macros := map[string]struct{}{
		"geomean":        {},
		"geometric_mean": {},
		"nullif":         {},
	}
	collisions := map[string][]string{
		"generate_series": {"scalar", "table"},
		"range":           {"scalar", "table"},
		"repeat":          {"scalar", "table"},
	}
	tableGenerators := make(map[string]struct{})
	for _, name := range BuiltinTableGenerators() {
		tableGenerators[name] = struct{}{}
	}
	catalogExemptions := map[string]struct{}{
		"!__postfix": {},
	}

	for _, name := range DefaultFunctions() {
		entries := catalog[name]
		if len(entries) == 0 {
			_, exempt := catalogExemptions[name]
			assert.True(t, exempt, "default function %q is absent from the DuckDB catalog", name)
			continue
		}

		types := make(map[string]struct{})
		for _, entry := range entries {
			types[entry.functionType] = struct{}{}
			assert.True(t, entry.internal, "default function %q is not internal", name)

			switch entry.functionType {
			case "aggregate", "scalar":
				assert.True(t, entry.sideEffects.Valid && !entry.sideEffects.Bool, "default function %q has side effects", name)
				assert.True(t, entry.stability.Valid && entry.stability.String == "CONSISTENT", "default function %q is not consistent", name)
			case "macro":
				_, allowed := macros[name]
				assert.True(t, allowed, "default function %q is an unreviewed macro", name)
			case "table":
				_, allowed := tableGenerators[name]
				assert.True(t, allowed, "default function %q is an unreviewed table function", name)
				assert.True(t, !entry.sideEffects.Valid || !entry.sideEffects.Bool, "default table function %q has side effects", name)
				assert.True(t, !entry.stability.Valid || entry.stability.String == "CONSISTENT", "default table function %q is not consistent", name)
			default:
				assert.Fail(t, "unreviewed function type", "default function %q has type %q", name, entry.functionType)
			}
		}

		gotTypes := make([]string, 0, len(types))
		for functionType := range types {
			gotTypes = append(gotTypes, functionType)
		}
		slices.Sort(gotTypes)

		if wantTypes, allowed := collisions[name]; allowed {
			assert.Equal(t, wantTypes, gotTypes, name)
		} else {
			assert.Len(t, gotTypes, 1, "default function %q has unreviewed type collisions: %v", name, gotTypes)
		}
	}

	for name := range macros {
		require.NotEmpty(t, catalog[name], name)
		for _, entry := range catalog[name] {
			assert.Equal(t, "macro", entry.functionType, name)
		}
	}
	for name, wantTypes := range collisions {
		gotTypes := make([]string, 0, len(catalog[name]))
		for _, entry := range catalog[name] {
			if !slices.Contains(gotTypes, entry.functionType) {
				gotTypes = append(gotTypes, entry.functionType)
			}
		}
		slices.Sort(gotTypes)
		assert.Equal(t, wantTypes, gotTypes, name)
	}
}

func TestDefaultFunctionsUnion(t *testing.T) {
	groups := [][]string{
		BuiltinOperators(),
		BuiltinAggregates(),
		BuiltinWindows(),
		BuiltinSyntaxHelpers(),
		BuiltinTableGenerators(),
		CommonScalarFunctions(),
	}

	wantSet := make(map[string]struct{})
	for _, group := range groups {
		for _, function := range group {
			wantSet[function] = struct{}{}
		}
	}
	want := make([]string, 0, len(wantSet))
	for function := range wantSet {
		want = append(want, function)
	}
	slices.Sort(want)

	got := DefaultFunctions()
	assert.Equal(t, want, got)
	assert.True(t, slices.IsSorted(got))
	assert.Equal(t, len(got), len(slices.Compact(slices.Clone(got))))

	for _, function := range []string{
		"aggregate",
		"current_setting",
		"duckdb_tables",
		"getenv",
		"glob",
		"histogram",
		"json_deserialize_sql",
		"json_execute_serialized_sql",
		"list_aggregate",
		"nextval",
		"query",
		"query_table",
		"random",
		"read_csv",
		"read_json",
		"read_parquet",
		"read_text",
		"setseed",
		"uuid",
	} {
		assert.NotContains(t, got, function)
	}

	first := got[0]
	got[0] = "mutated"
	assert.Equal(t, first, DefaultFunctions()[0])
}

func TestFunctionNamesNormalize(t *testing.T) {
	assert.Equal(t, []string{"+", "sum"}, functionNames(
		[]string{" SUM ", "", "+"},
		[]string{"sum", " + "},
	))
}
