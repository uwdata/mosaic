package remoteread

var lanceFunctions = map[string]PathArguments{
	"__lance_cleanup_old_versions": positionalPath(0),
	"__lance_compact_files":        positionalPath(0),
	"__lance_exec":                 positionalPath(0),
	"__lance_namespace_scan":       positionalPath(0),
	"__lance_optimize_index":       positionalPath(0),
	"__lance_scan":                 positionalPath(0),
	"__lance_set_auto_cleanup":     positionalPath(0),
	"__lance_show_auto_cleanup":    positionalPath(0),
	"lance_fts":                    positionalPath(0),
	"lance_hybrid_search":          positionalPath(0),
	"lance_vector_search":          positionalPath(0),
}
