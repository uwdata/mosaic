package remoteread

import (
	"reflect"
	"slices"
	"strings"
	"testing"
)

var expectedFunctionNames = []string{
	"__lance_cleanup_old_versions",
	"__lance_compact_files",
	"__lance_exec",
	"__lance_namespace_scan",
	"__lance_optimize_index",
	"__lance_scan",
	"__lance_set_auto_cleanup",
	"__lance_show_auto_cleanup",
	"copy_dir",
	"delta_domain_metadata",
	"delta_list_files",
	"delta_scan",
	"ducklake_add_data_files",
	"glob",
	"histogram",
	"histogram_values",
	"iceberg_column_stats",
	"iceberg_metadata",
	"iceberg_partition_stats",
	"iceberg_scan",
	"iceberg_snapshots",
	"lance_fts",
	"lance_hybrid_search",
	"lance_vector_search",
	"parquet_bloom_probe",
	"parquet_file_metadata",
	"parquet_full_metadata",
	"parquet_kv_metadata",
	"parquet_metadata",
	"parquet_scan",
	"parquet_schema",
	"query_table",
	"read_avro",
	"read_blob",
	"read_csv",
	"read_csv_auto",
	"read_duckdb",
	"read_json",
	"read_json_auto",
	"read_json_objects",
	"read_json_objects_auto",
	"read_ndjson",
	"read_ndjson_auto",
	"read_ndjson_objects",
	"read_parquet",
	"read_postgres_binary",
	"read_text",
	"read_vortex",
	"read_xlsx",
	"shapefile_meta",
	"sniff_csv",
	"sql_auto_complete",
	"sqlite_attach",
	"sqlite_scan",
	"st_read",
	"st_read_meta",
	"st_readosm",
	"st_readshp",
	"vortex_scan",
}

func TestInventory(t *testing.T) {
	if got := FunctionNames(); !reflect.DeepEqual(got, expectedFunctionNames) {
		t.Fatalf("FunctionNames() = %v, want %v", got, expectedFunctionNames)
	}

	for _, group := range inventoryGroups {
		t.Run(group.name, func(t *testing.T) {
			for name, arguments := range group.functions {
				if name != strings.TrimSpace(name) || name != strings.ToLower(name) {
					t.Errorf("invalid function name %q", name)
				}
				assertArguments(t, name, arguments)
			}
		})
	}
}

func TestPathArguments(t *testing.T) {
	for _, name := range expectedFunctionNames {
		want := positionalPath(0)
		switch name {
		case "copy_dir":
			want = positionalPath(0, "src_dir")
		case "delta_scan":
			want = positionalPath(0, "log_tail")
		case "ducklake_add_data_files":
			want = positionalPath(2)
		case "histogram", "histogram_values":
			want = positionalPath(0, "source")
		case "st_read":
			want = positionalPath(0, "sibling_files")
		}

		got, ok := Lookup(name)
		if !ok {
			t.Fatalf("Lookup(%q) not found", name)
		}
		if !reflect.DeepEqual(got, want) {
			t.Errorf("Lookup(%q) = %#v, want %#v", name, got, want)
		}
	}
}

func TestLookupNormalizesName(t *testing.T) {
	arguments, ok := Lookup(" READ_PARQUET ")
	if !ok || !reflect.DeepEqual(arguments, positionalPath(0)) {
		t.Fatalf("Lookup() = %#v, %v", arguments, ok)
	}

	arguments, ok = Lookup("missing")
	if ok || !reflect.DeepEqual(arguments, PathArguments{}) {
		t.Fatalf("Lookup() = %#v, %v", arguments, ok)
	}
}

func TestFunctionNamesReturnsCopy(t *testing.T) {
	names := FunctionNames()
	names[0] = "mutated"
	if got := FunctionNames(); !reflect.DeepEqual(got, expectedFunctionNames) {
		t.Fatalf("FunctionNames() = %v, want %v", got, expectedFunctionNames)
	}
}

func assertArguments(t *testing.T, name string, arguments PathArguments) {
	t.Helper()
	if len(arguments.Positional) == 0 && len(arguments.Named) == 0 {
		t.Errorf("%q has no path arguments", name)
	}
	if !slices.IsSorted(arguments.Positional) {
		t.Errorf("%q positional arguments are not sorted", name)
	}
	if len(arguments.Positional) != len(slices.Compact(slices.Clone(arguments.Positional))) {
		t.Errorf("%q has duplicate positional arguments", name)
	}
	for _, index := range arguments.Positional {
		if index < 0 {
			t.Errorf("%q has negative positional argument %d", name, index)
		}
	}
	if !slices.IsSorted(arguments.Named) {
		t.Errorf("%q named arguments are not sorted", name)
	}
	if len(arguments.Named) != len(slices.Compact(slices.Clone(arguments.Named))) {
		t.Errorf("%q has duplicate named arguments", name)
	}
	for _, named := range arguments.Named {
		if named == "" || named != strings.TrimSpace(named) || named != strings.ToLower(named) {
			t.Errorf("%q has invalid named argument %q", name, named)
		}
	}
}
