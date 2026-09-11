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
