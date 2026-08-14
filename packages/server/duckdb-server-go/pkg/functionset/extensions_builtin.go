package functionset

// These inventories match DuckDB 1.5.5 at d8cdaa33fda8df955cc76ef58a280f68f4cd43fa.
var autocompleteComputeFunctions = [...]string{
	"check_peg_parser",
}

var autocompleteElevatedFunctions = [...]string{
	"disable_peg_parser",
	"enable_peg_parser",
	"sql_auto_complete",
}

var jsonComputeFunctions = [...]string{
	"->>",
	"array_to_json",
	"from_json",
	"from_json_strict",
	"json",
	"json_array",
	"json_array_length",
	"json_contains",
	"json_deserialize_sql",
	"json_each",
	"json_exists",
	"json_extract",
	"json_extract_path",
	"json_extract_path_text",
	"json_extract_string",
	"json_group_array",
	"json_group_object",
	"json_group_structure",
	"json_keys",
	"json_merge_patch",
	"json_object",
	"json_pretty",
	"json_quote",
	"json_serialize_sql",
	"json_structure",
	"json_transform",
	"json_transform_strict",
	"json_tree",
	"json_type",
	"json_valid",
	"json_value",
	"row_to_json",
	"to_json",
}

var jsonElevatedFunctions = [...]string{
	"json_execute_serialized_sql",
	"json_serialize_plan",
	"read_json",
	"read_json_auto",
	"read_json_objects",
	"read_json_objects_auto",
	"read_ndjson",
	"read_ndjson_auto",
	"read_ndjson_objects",
}

var tpcdsComputeFunctions = [...]string{
	"tpcds_answers",
	"tpcds_queries",
}

var tpcdsElevatedFunctions = [...]string{
	"dsdgen",
	"tpcds",
}

var tpchComputeFunctions = [...]string{
	"tpch_answers",
	"tpch_queries",
}

var tpchElevatedFunctions = [...]string{
	"dbgen",
	"tpch",
}
