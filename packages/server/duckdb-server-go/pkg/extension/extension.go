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
	"path/filepath"
	"strings"
	"unicode"
	"unicode/utf8"
)

var (
	// ErrInvalidSpec identifies extension grammar and specification errors.
	ErrInvalidSpec = errors.New("extension: invalid specification")
	// ErrInstall identifies a failed DuckDB INSTALL statement.
	ErrInstall = errors.New("extension: install failed")
	// ErrLoad identifies a failed DuckDB LOAD statement.
	ErrLoad = errors.New("extension: load failed")
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
// zero value selects Core. Parse trims grammar whitespace, while Repository and
// Path values supplied programmatically are used literally.
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

// InstallAndLoadFile returns a specification that installs a DuckDB extension
// file and loads it by the installed name DuckDB derives from the filename.
func InstallAndLoadFile(path string) Spec {
	return Spec{
		Path: path,
		Mode: ModeInstallAndLoad,
	}
}

// LoadFile returns a specification that loads a DuckDB extension directly from
// path without installing it first.
func LoadFile(path string) Spec {
	return Spec{
		Path: path,
		Mode: ModeLoadOnly,
	}
}

// Parse parses named extensions using the command-line grammar
// "name|repository,name2". Each argument may contain one or more comma-
// separated specifications, which permits callers to pass a []string with
// Parse(values...). Surrounding grammar whitespace is trimmed. A missing
// repository selects Core. Parse() and Parse("") return no specifications.
func Parse(values ...string) ([]Spec, error) {
	if len(values) == 0 || (len(values) == 1 && values[0] == "") {
		return nil, nil
	}

	var specs []Spec
	var origins []specOrigin
	builder := newPlanBuilder(len(values))
	for valueIndex, value := range values {
		for entryIndex, raw := range strings.Split(value, ",") {
			entry := strings.TrimSpace(raw)
			if entry == "" {
				return nil, parseEntryError(valueIndex, entryIndex, errors.New("entry is blank"))
			}

			if strings.Count(entry, "|") > 1 {
				return nil, parseEntryError(
					valueIndex,
					entryIndex,
					errors.New("entry has more than one repository delimiter"),
				)
			}

			name, repository, hasRepository := strings.Cut(entry, "|")
			name = strings.TrimSpace(name)
			if name == "" {
				return nil, parseEntryError(valueIndex, entryIndex, errors.New("name is blank"))
			}

			if hasRepository {
				repository = strings.TrimSpace(repository)
				if repository == "" {
					return nil, parseEntryError(valueIndex, entryIndex, errors.New("repository is blank"))
				}
			} else {
				repository = string(Core)
			}

			spec := InstallAndLoad(name, Repository(repository))
			if err := builder.add(spec, len(specs)); err != nil {
				var conflict *targetConflictError
				if errors.As(err, &conflict) {
					previous := origins[conflict.previous]
					return nil, fmt.Errorf(
						"%w: input %d entry %d conflicts with input %d entry %d target %q",
						ErrInvalidSpec,
						valueIndex+1,
						entryIndex+1,
						previous.value+1,
						previous.entry+1,
						conflict.target,
					)
				}
				return nil, parseEntryError(valueIndex, entryIndex, err)
			}

			specs = append(specs, spec)
			origins = append(origins, specOrigin{value: valueIndex, entry: entryIndex})
		}
	}

	return specs, nil
}

type specOrigin struct {
	value int
	entry int
}

func parseEntryError(valueIndex, entryIndex int, err error) error {
	return fmt.Errorf(
		"%w: input %d entry %d: %v",
		ErrInvalidSpec,
		valueIndex+1,
		entryIndex+1,
		err,
	)
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
	operation  error
	target     string
	repository string
	file       bool
}

func (c command) wrap(err error) error {
	if c.repository != "" {
		return fmt.Errorf(
			"%w for %q from repository %q: %w",
			c.operation,
			c.target,
			c.repository,
			err,
		)
	}
	if c.file {
		return fmt.Errorf("%w for file %q: %w", c.operation, c.target, err)
	}
	return fmt.Errorf("%w for %q: %w", c.operation, c.target, err)
}

type specIdentity struct {
	mode       Mode
	name       string
	path       string
	repository Repository
}

type target struct {
	key   string
	label string
}

type compiledSpec struct {
	commands []command
	identity specIdentity
	targets  []target
}

type seenTarget struct {
	identity specIdentity
	index    int
}

type planBuilder struct {
	commands []command
	seen     map[string]seenTarget
}

func newPlanBuilder(capacity int) *planBuilder {
	return &planBuilder{
		commands: make([]command, 0, capacity*2),
		seen:     make(map[string]seenTarget, capacity),
	}
}

func (b *planBuilder) add(spec Spec, index int) error {
	compiled, err := compileSpec(spec)
	if err != nil {
		return err
	}

	duplicate := false
	for _, target := range compiled.targets {
		previous, ok := b.seen[target.key]
		if !ok {
			continue
		}
		if previous.identity != compiled.identity {
			return &targetConflictError{
				previous: previous.index,
				target:   target.label,
			}
		}
		duplicate = true
	}
	if duplicate {
		return nil
	}

	for _, target := range compiled.targets {
		b.seen[target.key] = seenTarget{identity: compiled.identity, index: index}
	}
	b.commands = append(b.commands, compiled.commands...)
	return nil
}

type targetConflictError struct {
	previous int
	target   string
}

func (e *targetConflictError) Error() string {
	return fmt.Sprintf("conflicts with previous specification target %q", e.target)
}

func compile(specs []Spec) ([]command, error) {
	builder := newPlanBuilder(len(specs))
	for index, spec := range specs {
		if err := builder.add(spec, index); err != nil {
			var conflict *targetConflictError
			if errors.As(err, &conflict) {
				return nil, fmt.Errorf(
					"%w: specification %d conflicts with specification %d target %q",
					ErrInvalidSpec,
					index+1,
					conflict.previous+1,
					conflict.target,
				)
			}
			return nil, fmt.Errorf("%w: specification %d: %v", ErrInvalidSpec, index+1, err)
		}
	}
	return builder.commands, nil
}

func compileSpec(spec Spec) (compiledSpec, error) {
	if spec.Mode != ModeInstallAndLoad && spec.Mode != ModeLoadOnly {
		return compiledSpec{}, fmt.Errorf("invalid mode %d", spec.Mode)
	}

	hasName := spec.Name != ""
	hasPath := spec.Path != ""
	if hasName == hasPath {
		return compiledSpec{}, errors.New("exactly one of Name and Path must be set")
	}

	if hasName {
		return compileNamed(spec)
	}
	return compileFile(spec)
}

func compileNamed(spec Spec) (compiledSpec, error) {
	if strings.TrimSpace(spec.Name) == "" {
		return compiledSpec{}, errors.New("name is blank")
	}
	if err := validateValue("name", spec.Name); err != nil {
		return compiledSpec{}, err
	}
	if !validIdentifier(spec.Name) {
		return compiledSpec{}, fmt.Errorf("name %q is not a safe DuckDB identifier", spec.Name)
	}

	name := canonicalExtensionName(spec.Name)
	targets := []target{{key: "name:" + name, label: spec.Name}}
	if spec.Mode == ModeLoadOnly {
		if spec.Repository != "" {
			return compiledSpec{}, errors.New("repository cannot be set in load-only mode")
		}
		return compiledSpec{
			commands: []command{{
				sql:       "LOAD " + spec.Name,
				operation: ErrLoad,
				target:    spec.Name,
			}},
			identity: specIdentity{mode: spec.Mode, name: name},
			targets:  targets,
		}, nil
	}

	repository := spec.Repository
	if repository == "" {
		repository = Core
	}
	if strings.TrimSpace(string(repository)) == "" {
		return compiledSpec{}, errors.New("repository is blank")
	}
	if err := validateValue("repository", string(repository)); err != nil {
		return compiledSpec{}, err
	}

	repositorySQL := string(repository)
	if !isBuiltIn(repository) {
		if builtIn := caseInsensitiveBuiltIn(repository); builtIn != "" {
			return compiledSpec{}, fmt.Errorf(
				"repository %q matches built-in repository %q but must use canonical casing; use %q for a custom path",
				repository,
				builtIn,
				"./"+string(repository),
			)
		}
		repositorySQL = quote(string(repository))
	}

	metadata := command{
		target:     spec.Name,
		repository: string(repository),
	}
	install := metadata
	install.sql = "INSTALL " + spec.Name + " FROM " + repositorySQL
	install.operation = ErrInstall
	load := metadata
	load.sql = "LOAD " + spec.Name
	load.operation = ErrLoad

	return compiledSpec{
		commands: []command{install, load},
		identity: specIdentity{
			mode:       spec.Mode,
			name:       name,
			repository: repository,
		},
		targets: targets,
	}, nil
}

func compileFile(spec Spec) (compiledSpec, error) {
	if spec.Repository != "" {
		return compiledSpec{}, errors.New("repository cannot be set for a direct extension file")
	}
	if strings.TrimSpace(spec.Path) == "" {
		return compiledSpec{}, errors.New("path is blank")
	}
	if err := validateValue("path", spec.Path); err != nil {
		return compiledSpec{}, err
	}

	pathSQL := quote(spec.Path)
	pathTarget := target{key: "path:" + spec.Path, label: spec.Path}
	if spec.Mode == ModeLoadOnly {
		return compiledSpec{
			commands: []command{{
				sql:       "LOAD " + pathSQL,
				operation: ErrLoad,
				target:    spec.Path,
				file:      true,
			}},
			identity: specIdentity{mode: spec.Mode, path: spec.Path},
			targets:  []target{pathTarget},
		}, nil
	}

	name, err := installedExtensionName(spec.Path)
	if err != nil {
		return compiledSpec{}, err
	}
	return compiledSpec{
		commands: []command{
			{
				sql:       "INSTALL " + pathSQL,
				operation: ErrInstall,
				target:    spec.Path,
				file:      true,
			},
			{
				sql:       "LOAD " + quote(name),
				operation: ErrLoad,
				target:    name,
			},
		},
		identity: specIdentity{mode: spec.Mode, name: name, path: spec.Path},
		targets: []target{
			pathTarget,
			{key: "name:" + name, label: name},
		},
	}, nil
}

func installedExtensionName(extensionPath string) (string, error) {
	base := asciiLower(filepath.Base(extensionPath))
	var name string
	for _, segment := range strings.Split(base, ".") {
		if segment != "" {
			name = segment
			break
		}
	}
	if name == "" {
		return "", errors.New("path does not contain an extension name")
	}
	if strings.ContainsAny(name, `/\`) {
		return "", fmt.Errorf("path derives extension name %q that DuckDB cannot load by name", name)
	}
	return canonicalExtensionName(name), nil
}

// canonicalExtensionName mirrors DuckDB's aliases for the pinned DuckDB
// release so duplicate detection uses the same installed target names.
func canonicalExtensionName(name string) string {
	name = asciiLower(name)
	switch name {
	case "http", "https", "s3":
		return "httpfs"
	case "md":
		return "motherduck"
	case "mysql":
		return "mysql_scanner"
	case "odbc":
		return "odbc_scanner"
	case "postgres":
		return "postgres_scanner"
	case "sqlite", "sqlite3":
		return "sqlite_scanner"
	case "uc_catalog":
		return "unity_catalog"
	default:
		return name
	}
}

func asciiLower(value string) string {
	result := []byte(value)
	for index, char := range result {
		if char >= 'A' && char <= 'Z' {
			result[index] = char + ('a' - 'A')
		}
	}
	return string(result)
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

func caseInsensitiveBuiltIn(repository Repository) Repository {
	switch strings.ToLower(string(repository)) {
	case string(Core):
		return Core
	case string(CoreNightly):
		return CoreNightly
	case string(Community):
		return Community
	case string(LocalBuildDebug):
		return LocalBuildDebug
	case string(LocalBuildRelease):
		return LocalBuildRelease
	default:
		return ""
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
