// Package extensions provides trusted DuckDB extension installation and loading operations.
package extensions

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
)

var (
	ErrInvalidInput = errors.New("extensions: invalid input")
	ErrInstall      = errors.New("extensions: install failed")
	ErrLoad         = errors.New("extensions: load failed")
)

type extension struct {
	name       string
	repository string
}

// Validate reports command-line grammar errors before a connection is opened.
func Validate(values ...string) error {
	_, err := parse(values...)
	return err
}

// ParseAndInstall accepts the command-line grammar name|repository,name2 and
// installs and loads each entry in order. Each argument may contain comma-
// separated entries, so a []string can be expanded directly. Repository values
// are DuckDB aliases; an omitted repository uses DuckDB's default.
func ParseAndInstall(
	ctx context.Context,
	execer driver.ExecerContext,
	values ...string,
) error {
	extensions, err := parse(values...)
	if err != nil {
		return err
	}
	for _, extension := range extensions {
		if err := InstallAndLoad(ctx, execer, extension.name, extension.repository); err != nil {
			return err
		}
	}
	return nil
}

func parse(values ...string) ([]extension, error) {
	if len(values) == 0 || (len(values) == 1 && values[0] == "") {
		return nil, nil
	}

	var extensions []extension
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
					return nil, parseEntryError(
						valueIndex,
						entryIndex,
						errors.New("repository is blank"),
					)
				}
			}

			extensions = append(extensions, extension{name: name, repository: repository})
		}
	}

	return extensions, nil
}

func parseEntryError(valueIndex, entryIndex int, err error) error {
	return fmt.Errorf(
		"%w: input %d entry %d: %v",
		ErrInvalidInput,
		valueIndex+1,
		entryIndex+1,
		err,
	)
}

// InstallAndLoad uses DuckDB's default repository when repository is empty.
// Otherwise, repository is a DuckDB repository alias.
func InstallAndLoad(
	ctx context.Context,
	execer driver.ExecerContext,
	name string,
	repository string,
) error {
	repositorySQL := ""
	if repository != "" {
		repositorySQL = quoteIdentifier(repository)
	}
	return installAndLoad(ctx, execer, name, repository, repositorySQL)
}

// InstallAndLoadFromCustomRepository installs from a repository URL or path.
func InstallAndLoadFromCustomRepository(
	ctx context.Context,
	execer driver.ExecerContext,
	name string,
	repository string,
) error {
	return installAndLoad(ctx, execer, name, repository, quote(repository))
}

func installAndLoad(
	ctx context.Context,
	execer driver.ExecerContext,
	name string,
	repository string,
	repositorySQL string,
) error {
	if err := validate(ctx, execer); err != nil {
		return err
	}

	nameSQL := quote(name)
	query := "INSTALL " + nameSQL
	if repositorySQL != "" {
		query += " FROM " + repositorySQL
	}
	if _, err := execer.ExecContext(ctx, query, nil); err != nil {
		return namedError(ErrInstall, name, repository, err)
	}
	if _, err := execer.ExecContext(ctx, "LOAD "+nameSQL, nil); err != nil {
		return namedError(ErrLoad, name, repository, err)
	}
	return nil
}

func LoadInstalled(ctx context.Context, execer driver.ExecerContext, name string) error {
	if err := validate(ctx, execer); err != nil {
		return err
	}
	if _, err := execer.ExecContext(ctx, "LOAD "+quote(name), nil); err != nil {
		return fmt.Errorf("%w for %q: %w", ErrLoad, name, err)
	}
	return nil
}

// InstallAndLoadFile loads the installed name DuckDB derives from path rather
// than loading the source file again on every connection.
func InstallAndLoadFile(ctx context.Context, execer driver.ExecerContext, path string) error {
	if err := validate(ctx, execer); err != nil {
		return err
	}

	if _, err := execer.ExecContext(ctx, "INSTALL "+quote(filePath(path)), nil); err != nil {
		return fmt.Errorf("%w for file %q: %w", ErrInstall, path, err)
	}
	name := installedExtensionName(path)
	if _, err := execer.ExecContext(ctx, "LOAD "+quote(name), nil); err != nil {
		return fmt.Errorf("%w for %q: %w", ErrLoad, name, err)
	}
	return nil
}

func LoadFile(ctx context.Context, execer driver.ExecerContext, path string) error {
	if err := validate(ctx, execer); err != nil {
		return err
	}
	if _, err := execer.ExecContext(ctx, "LOAD "+quote(filePath(path)), nil); err != nil {
		return fmt.Errorf("%w for file %q: %w", ErrLoad, path, err)
	}
	return nil
}

func validate(ctx context.Context, execer driver.ExecerContext) error {
	if ctx == nil {
		return errors.New("extensions: nil context")
	}
	if execer == nil {
		return errors.New("extensions: nil execer")
	}
	return nil
}

func namedError(category error, name, repository string, err error) error {
	if repository != "" {
		return fmt.Errorf(
			"%w for %q from repository %q: %w",
			category,
			name,
			repository,
			err,
		)
	}
	return fmt.Errorf("%w for %q: %w", category, name, err)
}

// DuckDB derives an installed extension's name from the first non-empty part
// of its basename and applies casing and aliases itself when LOAD runs.
func installedExtensionName(extensionPath string) string {
	for _, segment := range strings.Split(filepath.Base(extensionPath), ".") {
		if segment != "" {
			return segment
		}
	}
	return ""
}

// DuckDB otherwise interprets a bare relative filename as an extension name.
func filePath(path string) string {
	if strings.ContainsAny(path, `./\`) {
		return path
	}
	return "./" + path
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func quote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
