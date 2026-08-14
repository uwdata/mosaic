package functionset

import (
	"database/sql"
	"slices"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
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

	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)
	db := sql.OpenDB(connector)
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, connector.Close())
	})

	rows, err := db.QueryContext(t.Context(), `
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
		"array_append":               {},
		"array_pop_back":             {},
		"array_pop_front":            {},
		"array_prepend":              {},
		"array_push_back":            {},
		"array_push_front":           {},
		"array_reverse":              {},
		"array_to_string":            {},
		"date_add":                   {},
		"days_in_month":              {},
		"fdiv":                       {},
		"fmod":                       {},
		"generate_subscripts":        {},
		"geomean":                    {},
		"geometric_mean":             {},
		"json":                       {},
		"json_group_array":           {},
		"json_group_object":          {},
		"json_group_structure":       {},
		"list_any_value":             {},
		"list_append":                {},
		"list_approx_count_distinct": {},
		"list_avg":                   {},
		"list_bit_and":               {},
		"list_bit_or":                {},
		"list_bit_xor":               {},
		"list_bool_and":              {},
		"list_bool_or":               {},
		"list_count":                 {},
		"list_entropy":               {},
		"list_first":                 {},
		"list_histogram":             {},
		"list_kurtosis":              {},
		"list_kurtosis_pop":          {},
		"list_last":                  {},
		"list_mad":                   {},
		"list_max":                   {},
		"list_median":                {},
		"list_min":                   {},
		"list_mode":                  {},
		"list_prepend":               {},
		"list_product":               {},
		"list_reverse":               {},
		"list_sem":                   {},
		"list_skewness":              {},
		"list_stddev_pop":            {},
		"list_stddev_samp":           {},
		"list_string_agg":            {},
		"list_sum":                   {},
		"list_var_pop":               {},
		"list_var_samp":              {},
		"map_contains_entry":         {},
		"map_contains_value":         {},
		"md5_number_lower":           {},
		"md5_number_upper":           {},
		"nullif":                     {},
		"regexp_split_to_table":      {},
		"round_even":                 {},
		"roundbankers":               {},
		"split_part":                 {},
		"wavg":                       {},
		"weighted_avg":               {},
	}
	excludedMacros := map[string]struct{}{
		"ago":                                {},
		"array_to_string_comma_default":      {},
		"col_description":                    {},
		"current_catalog":                    {},
		"current_database":                   {},
		"current_query":                      {},
		"current_role":                       {},
		"current_schema":                     {},
		"current_schemas":                    {},
		"current_user":                       {},
		"format_pg_type":                     {},
		"format_type":                        {},
		"get_block_size":                     {},
		"has_any_column_privilege":           {},
		"has_column_privilege":               {},
		"has_database_privilege":             {},
		"has_foreign_data_wrapper_privilege": {},
		"has_function_privilege":             {},
		"has_language_privilege":             {},
		"has_schema_privilege":               {},
		"has_sequence_privilege":             {},
		"has_server_privilege":               {},
		"has_table_privilege":                {},
		"has_tablespace_privilege":           {},
		"inet_client_addr":                   {},
		"inet_client_port":                   {},
		"inet_server_addr":                   {},
		"inet_server_port":                   {},
		"map_to_pg_oid":                      {},
		"obj_description":                    {},
		"pg_collation_is_visible":            {},
		"pg_conf_load_time":                  {},
		"pg_conversion_is_visible":           {},
		"pg_function_is_visible":             {},
		"pg_get_constraintdef":               {},
		"pg_get_expr":                        {},
		"pg_get_viewdef":                     {},
		"pg_has_role":                        {},
		"pg_is_other_temp_schema":            {},
		"pg_my_temp_schema":                  {},
		"pg_opclass_is_visible":              {},
		"pg_operator_is_visible":             {},
		"pg_opfamily_is_visible":             {},
		"pg_postmaster_start_time":           {},
		"pg_size_pretty":                     {},
		"pg_sleep":                           {},
		"pg_table_is_visible":                {},
		"pg_ts_config_is_visible":            {},
		"pg_ts_dict_is_visible":              {},
		"pg_ts_parser_is_visible":            {},
		"pg_ts_template_is_visible":          {},
		"pg_type_is_visible":                 {},
		"pg_typeof":                          {},
		"session_user":                       {},
		"shobj_description":                  {},
		"user":                               {},
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

	for _, name := range builtinDefaultFunctions() {
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
	defaults := DefaultFunctions()
	for name, entries := range catalog {
		isMacro := false
		for _, entry := range entries {
			isMacro = isMacro || entry.functionType == "macro"
		}
		if !isMacro {
			continue
		}

		_, included := macros[name]
		_, excluded := excludedMacros[name]
		assert.NotEqual(t, included, excluded, "macro %q must have exactly one policy decision", name)
		assert.Equal(t, included, slices.Contains(defaults, name), "macro %q has the wrong default policy", name)
	}
	for name := range excludedMacros {
		require.NotEmpty(t, catalog[name], name)
		assert.NotContains(t, defaults, name)
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
	for _, extension := range CoreExtensions() {
		groups = append(groups, extension.Compute())
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
		"ago",
		"current_setting",
		"duckdb_tables",
		"getenv",
		"glob",
		"histogram",
		"json_execute_serialized_sql",
		"list_aggregate",
		"list_aggr",
		"nextval",
		"pg_sleep",
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
