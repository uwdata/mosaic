// Package extension provides reusable DuckDB extension initialization.
//
// An Initializer is suitable for use with duckdb.NewConnector. DuckDB invokes
// it for every new connection, so every specification loads its extension on
// every connection. Install-and-load specifications also repeat INSTALL;
// DuckDB handles extensions that are already installed.
package extension

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"strings"
	"unicode"
	"unicode/utf8"
)

// Repository identifies a DuckDB extension repository. Values other than the
// built-in constants are treated as custom repository URLs or paths.
type Repository string

const (
	// Core is DuckDB's stable core extension repository.
	Core Repository = "core"
	// CoreNightly is DuckDB's nightly core extension repository.
	CoreNightly Repository = "core_nightly"
	// Community is DuckDB's community extension repository.
	Community Repository = "community"
	// LocalBuildDebug is DuckDB's local debug-build repository.
	LocalBuildDebug Repository = "local_build_debug"
	// LocalBuildRelease is DuckDB's local release-build repository.
	LocalBuildRelease Repository = "local_build_release"
)

// Mode controls whether an extension is installed before it is loaded.
type Mode uint8

const (
	// ModeInstallAndLoad installs and then loads an extension on each new
	// connection. It is the zero value.
	ModeInstallAndLoad Mode = iota

	// ModeLoadOnly loads an extension that has already been installed or a
	// direct extension file without first installing it.
	ModeLoadOnly
)

// Spec describes one DuckDB extension. Exactly one of Name and Path must be
// set. Repository applies only to named extensions in ModeInstallAndLoad; its
// zero value selects Core.
type Spec struct {
	Name       string
	Repository Repository
	Path       string
	Mode       Mode
}

// Initializer initializes extensions on a DuckDB connection.
type Initializer func(driver.ExecerContext) error

// InstallAndLoad returns a specification that installs a named extension from
// repository and loads it. An empty repository selects Core.
func InstallAndLoad(name string, repository Repository) Spec {
	return Spec{
		Name:       name,
		Repository: repository,
		Mode:       ModeInstallAndLoad,
	}
}

// LoadInstalled returns a specification that loads an already-installed named
// extension.
func LoadInstalled(name string) Spec {
	return Spec{
		Name: name,
		Mode: ModeLoadOnly,
	}
}

// InstallAndLoadFile returns a specification that installs and loads a direct
// DuckDB extension file.
func InstallAndLoadFile(path string) Spec {
	return Spec{
		Path: path,
		Mode: ModeInstallAndLoad,
	}
}

// LoadFile returns a specification that loads a direct DuckDB extension file
// without installing it first.
func LoadFile(path string) Spec {
	return Spec{
		Path: path,
		Mode: ModeLoadOnly,
	}
}

// Parse parses named extensions using the command-line grammar
// "name|repository,name2". Each argument may contain one or more comma-
// separated specifications, which permits callers to pass a []string with
// Parse(values...). A missing repository selects Core. Parse() and Parse("")
// return no specifications.
func Parse(values ...string) ([]Spec, error) {
	if len(values) == 0 || (len(values) == 1 && values[0] == "") {
		return nil, nil
	}

	var specs []Spec
	for valueIndex, value := range values {
		for entryIndex, raw := range strings.Split(value, ",") {
			entry := strings.TrimSpace(raw)
			if entry == "" {
				return nil, fmt.Errorf(
					"extension input %d entry %d is blank",
					valueIndex+1,
					entryIndex+1,
				)
			}

			if strings.Count(entry, "|") > 1 {
				return nil, fmt.Errorf(
					"extension input %d entry %d has more than one repository delimiter",
					valueIndex+1,
					entryIndex+1,
				)
			}

			name, repository, hasRepository := strings.Cut(entry, "|")
			name = strings.TrimSpace(name)
			if name == "" {
				return nil, fmt.Errorf(
					"extension input %d entry %d has a blank name",
					valueIndex+1,
					entryIndex+1,
				)
			}

			if !hasRepository {
				specs = append(specs, InstallAndLoad(name, Core))
				continue
			}

			repository = strings.TrimSpace(repository)
			if repository == "" {
				return nil, fmt.Errorf(
					"extension input %d entry %d has a blank repository",
					valueIndex+1,
					entryIndex+1,
				)
			}

			specs = append(specs, InstallAndLoad(name, Repository(repository)))
		}
	}

	if _, err := compile(specs); err != nil {
		return nil, err
	}

	return specs, nil
}

// NewInitializer validates specs and returns an immutable, reentrant
// connection initializer. ctx is used for every INSTALL and LOAD statement;
// callers should therefore provide a context whose lifetime matches the
// connector rather than an individual connection attempt.
func NewInitializer(ctx context.Context, specs ...Spec) (Initializer, error) {
	if ctx == nil {
		return nil, errors.New("extension: nil context")
	}

	commands, err := compile(specs)
	if err != nil {
		return nil, err
	}

	return func(execer driver.ExecerContext) error {
		if len(commands) == 0 {
			return nil
		}
		if execer == nil {
			return errors.New("extension: nil execer")
		}

		for _, command := range commands {
			if _, err := execer.ExecContext(ctx, command.sql, nil); err != nil {
				return command.wrap(err)
			}
		}

		return nil
	}, nil
}

type command struct {
	sql        string
	phase      string
	target     string
	repository string
	file       bool
}

func (c command) wrap(err error) error {
	if c.repository != "" {
		return fmt.Errorf(
			"extension %q from repository %q: %s: %w",
			c.target,
			c.repository,
			c.phase,
			err,
		)
	}
	if c.file {
		return fmt.Errorf("extension file %q: %s: %w", c.target, c.phase, err)
	}
	return fmt.Errorf("extension %q: %s: %w", c.target, c.phase, err)
}

func compile(specs []Spec) ([]command, error) {
	commands := make([]command, 0, len(specs)*2)
	seen := make(map[string]int, len(specs))

	for index, spec := range specs {
		compiled, key, err := compileSpec(spec)
		if err != nil {
			return nil, fmt.Errorf("extension specification %d: %w", index+1, err)
		}

		if previous, ok := seen[key]; ok {
			return nil, fmt.Errorf(
				"extension specification %d duplicates specification %d target %q",
				index+1,
				previous+1,
				specTarget(spec),
			)
		}
		seen[key] = index
		commands = append(commands, compiled...)
	}

	return commands, nil
}

func compileSpec(spec Spec) ([]command, string, error) {
	if spec.Mode != ModeInstallAndLoad && spec.Mode != ModeLoadOnly {
		return nil, "", fmt.Errorf("invalid mode %d", spec.Mode)
	}

	hasName := spec.Name != ""
	hasPath := spec.Path != ""
	if hasName == hasPath {
		return nil, "", errors.New("exactly one of Name and Path must be set")
	}

	if hasName {
		return compileNamed(spec)
	}
	return compileFile(spec)
}

func compileNamed(spec Spec) ([]command, string, error) {
	if strings.TrimSpace(spec.Name) == "" {
		return nil, "", errors.New("name is blank")
	}
	if err := validateValue("name", spec.Name); err != nil {
		return nil, "", err
	}
	if !validIdentifier(spec.Name) {
		return nil, "", fmt.Errorf("name %q is not a safe DuckDB identifier", spec.Name)
	}

	key := "name:" + strings.ToLower(spec.Name)
	if spec.Mode == ModeLoadOnly {
		if spec.Repository != "" {
			return nil, "", errors.New("repository cannot be set in load-only mode")
		}
		return []command{{
			sql:    "LOAD " + spec.Name,
			phase:  "LOAD",
			target: spec.Name,
		}}, key, nil
	}

	repository := spec.Repository
	if repository == "" {
		repository = Core
	}
	if strings.TrimSpace(string(repository)) == "" {
		return nil, "", errors.New("repository is blank")
	}
	if err := validateValue("repository", string(repository)); err != nil {
		return nil, "", err
	}

	repositorySQL := string(repository)
	if !isBuiltIn(repository) {
		repositorySQL = quote(string(repository))
	}

	metadata := command{
		target:     spec.Name,
		repository: string(repository),
	}
	install := metadata
	install.sql = "INSTALL " + spec.Name + " FROM " + repositorySQL
	install.phase = "INSTALL"
	load := metadata
	load.sql = "LOAD " + spec.Name
	load.phase = "LOAD"

	return []command{install, load}, key, nil
}

func compileFile(spec Spec) ([]command, string, error) {
	if spec.Repository != "" {
		return nil, "", errors.New("repository cannot be set for a direct extension file")
	}
	if strings.TrimSpace(spec.Path) == "" {
		return nil, "", errors.New("path is blank")
	}
	if err := validateValue("path", spec.Path); err != nil {
		return nil, "", err
	}

	pathSQL := quote(spec.Path)
	metadata := command{
		target: spec.Path,
		file:   true,
	}
	load := metadata
	load.sql = "LOAD " + pathSQL
	load.phase = "LOAD"

	key := "path:" + spec.Path
	if spec.Mode == ModeLoadOnly {
		return []command{load}, key, nil
	}

	install := metadata
	install.sql = "INSTALL " + pathSQL
	install.phase = "INSTALL"
	return []command{install, load}, key, nil
}

func validateValue(kind, value string) error {
	if !utf8.ValidString(value) {
		return fmt.Errorf("%s contains invalid UTF-8", kind)
	}
	for _, r := range value {
		if unicode.IsControl(r) {
			return fmt.Errorf("%s contains a control character", kind)
		}
	}
	if hasOuterQuoteWrapper(value) {
		return fmt.Errorf("%s must not include outer SQL quote wrappers", kind)
	}
	return nil
}

func validIdentifier(value string) bool {
	for index := 0; index < len(value); index++ {
		char := value[index]
		if index == 0 {
			if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char == '_' {
				continue
			}
			return false
		}
		if (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '_' {
			continue
		}
		return false
	}
	return value != ""
}

func isBuiltIn(repository Repository) bool {
	switch repository {
	case Core, CoreNightly, Community, LocalBuildDebug, LocalBuildRelease:
		return true
	default:
		return false
	}
}

func quote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}

func hasOuterQuoteWrapper(value string) bool {
	if len(value) < 2 {
		return false
	}
	first := value[0]
	last := value[len(value)-1]
	return (first == '\'' && last == '\'') || (first == '"' && last == '"')
}

func specTarget(spec Spec) string {
	if spec.Name != "" {
		return spec.Name
	}
	return spec.Path
}
