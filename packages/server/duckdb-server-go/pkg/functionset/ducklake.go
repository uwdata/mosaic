package functionset

// Source: https://github.com/duckdb/ducklake/tree/d8a1881e22516ea3d186d73e83c65fe5bd1a1dc4
var duckLakeComputeFunctions = [...]string{
	"murmur3_32",
}

var duckLakeElevatedFunctions = [...]string{
	"ducklake_add_data_files",
	"ducklake_cleanup_old_files",
	"ducklake_commit",
	"ducklake_current_snapshot",
	"ducklake_delete_orphaned_files",
	"ducklake_expire_snapshots",
	"ducklake_flush_inlined_data",
	"ducklake_last_committed_snapshot",
	"ducklake_list_files",
	"ducklake_merge_adjacent_files",
	"ducklake_options",
	"ducklake_rewrite_data_files",
	"ducklake_scan",
	"ducklake_set_commit_message",
	"ducklake_set_option",
	"ducklake_settings",
	"ducklake_snapshots",
	"ducklake_table_changes",
	"ducklake_table_deletions",
	"ducklake_table_info",
	"ducklake_table_insertions",
}
