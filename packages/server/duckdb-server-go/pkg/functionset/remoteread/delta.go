package remoteread

var deltaFunctions = map[string]PathArguments{
	"copy_dir":              positionalPath(0, "src_dir"),
	"delta_domain_metadata": positionalPath(0),
	"delta_list_files":      positionalPath(0),
	"delta_scan":            positionalPath(0, "log_tail"),
}
