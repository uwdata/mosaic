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
)

var (
	// ErrInvalidSpec identifies extension grammar and structural specification errors.
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
// zero value selects Core. Parse trims grammar whitespace, while values supplied
// programmatically are used literally.
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
// file and loads it by the name DuckDB derives from the filename.
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
// DuckDB validates extension and repository semantics when the initializer is
// invoked.
func Parse(values ...string) ([]Spec, error) {
	if len(values) == 0 || (len(values) == 1 && values[0] == "") {
		return nil, nil
	}

	var specs []Spec
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

			specs = append(specs, InstallAndLoad(name, Repository(repository)))
		}
	}

	return specs, nil
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

// NewInitializer returns an immutable, reentrant connection initializer. It
// validates only the structural shape of specs; DuckDB validates extension
// names, repositories, files, aliases, and compatibility when the initializer
// runs. ctx is used for every INSTALL and LOAD statement, so callers should
// provide a context whose lifetime matches the connector rather than an
// individual connection attempt.
func NewInitializer(ctx context.Context, specs ...Spec) (Initializer, error) {
	if ctx == nil {
		return nil, errors.New("extension: nil context")
	}

	specs = append([]Spec(nil), specs...)
	for index, spec := range specs {
		if err := validateSpec(spec); err != nil {
			return nil, fmt.Errorf("%w: specification %d: %v", ErrInvalidSpec, index+1, err)
		}
	}

	return func(execer driver.ExecerContext) error {
		if len(specs) == 0 {
			return nil
		}
		if execer == nil {
			return errors.New("extension: nil execer")
		}

		for _, spec := range specs {
			if err := initialize(ctx, execer, spec); err != nil {
				return err
			}
		}

		return nil
	}, nil
}

func validateSpec(spec Spec) error {
	if spec.Mode != ModeInstallAndLoad && spec.Mode != ModeLoadOnly {
		return fmt.Errorf("invalid mode %d", spec.Mode)
	}

	hasName := spec.Name != ""
	hasPath := spec.Path != ""
	if hasName == hasPath {
		return errors.New("exactly one of Name and Path must be set")
	}

	if hasName {
		if strings.TrimSpace(spec.Name) == "" {
			return errors.New("name is blank")
		}
		if spec.Mode == ModeLoadOnly && spec.Repository != "" {
			return errors.New("repository cannot be set in load-only mode")
		}
		if spec.Repository != "" && strings.TrimSpace(string(spec.Repository)) == "" {
			return errors.New("repository is blank")
		}
		return nil
	}

	if strings.TrimSpace(spec.Path) == "" {
		return errors.New("path is blank")
	}
	if spec.Repository != "" {
		return errors.New("repository cannot be set for a direct extension file")
	}
	return nil
}

func initialize(ctx context.Context, execer driver.ExecerContext, spec Spec) error {
	if spec.Name != "" {
		return initializeNamed(ctx, execer, spec)
	}
	return initializeFile(ctx, execer, spec)
}

func initializeNamed(ctx context.Context, execer driver.ExecerContext, spec Spec) error {
	nameSQL := quote(spec.Name)
	repository := spec.Repository
	if spec.Mode == ModeInstallAndLoad {
		if repository == "" {
			repository = Core
		}
		repositorySQL := string(repository)
		if !isBuiltIn(repository) {
			repositorySQL = quote(repositorySQL)
		}

		if err := execute(
			ctx,
			execer,
			"INSTALL "+nameSQL+" FROM "+repositorySQL,
			ErrInstall,
			spec.Name,
			string(repository),
			false,
		); err != nil {
			return err
		}
	}

	return execute(
		ctx,
		execer,
		"LOAD "+nameSQL,
		ErrLoad,
		spec.Name,
		string(repository),
		false,
	)
}

func initializeFile(ctx context.Context, execer driver.ExecerContext, spec Spec) error {
	pathSQL := quote(filePath(spec.Path))
	if spec.Mode == ModeLoadOnly {
		return execute(ctx, execer, "LOAD "+pathSQL, ErrLoad, spec.Path, "", true)
	}

	if err := execute(ctx, execer, "INSTALL "+pathSQL, ErrInstall, spec.Path, "", true); err != nil {
		return err
	}
	name := installedExtensionName(spec.Path)
	return execute(ctx, execer, "LOAD "+quote(name), ErrLoad, name, "", false)
}

func execute(
	ctx context.Context,
	execer driver.ExecerContext,
	query string,
	operation error,
	target string,
	repository string,
	file bool,
) error {
	if _, err := execer.ExecContext(ctx, query, nil); err != nil {
		if repository != "" {
			return fmt.Errorf(
				"%w for %q from repository %q: %w",
				operation,
				target,
				repository,
				err,
			)
		}
		if file {
			return fmt.Errorf("%w for file %q: %w", operation, target, err)
		}
		return fmt.Errorf("%w for %q: %w", operation, target, err)
	}
	return nil
}

// installedExtensionName extracts only the name DuckDB derives from a file's
// basename. DuckDB itself applies casing and extension aliases when LOAD runs.
func installedExtensionName(extensionPath string) string {
	for _, segment := range strings.Split(filepath.Base(extensionPath), ".") {
		if segment != "" {
			return segment
		}
	}
	return ""
}

// filePath disambiguates a bare relative filename from a DuckDB extension
// name. DuckDB treats operands containing a dot or path separator as paths.
func filePath(path string) string {
	if strings.ContainsAny(path, `./\`) {
		return path
	}
	return "./" + path
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
