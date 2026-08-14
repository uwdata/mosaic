package functionset

// Source: https://github.com/lance-format/lance-duckdb/tree/2f167ea1aa8b1201c89d53740b84deb00aff680e
var lanceComputeFunctions = [...]string{}

var lanceElevatedFunctions = [...]string{
	"__lance_cleanup_old_versions",
	"__lance_compact_files",
	"__lance_exec",
	"__lance_namespace_scan",
	"__lance_optimize_index",
	"__lance_scan",
	"__lance_set_auto_cleanup",
	"__lance_show_auto_cleanup",
	"__lance_truncate_table",
	"lance_fts",
	"lance_hybrid_search",
	"lance_vector_search",
}
