package main

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type securityProfile string

const (
	securityProfileCompat      securityProfile = "compat"
	securityProfileCatalogOnly securityProfile = "catalog-only"
	securityProfileLocalFiles  securityProfile = "local-files"
)

type resolvedSecurityProfile struct {
	name               securityProfile
	databaseDSN        string
	allowedDirectories []string
	allowedPaths       []string
}

type duckDBSetting struct {
	name  string
	value string
}

var strictProfileSettings = []duckDBSetting{
	{name: "allow_persistent_secrets", value: "false"},
	{name: "allow_community_extensions", value: "false"},
	{name: "allow_unsigned_extensions", value: "false"},
	{name: "allow_extensions_metadata_mismatch", value: "false"},
	{name: "allow_unredacted_secrets", value: "false"},
	{name: "allowed_configs", value: "[]"},
	{name: "autoinstall_known_extensions", value: "false"},
	{name: "autoload_known_extensions", value: "false"},
	{name: "enable_external_file_cache", value: "false"},
}

func resolveSecurityProfile(
	name string,
	databaseDSN string,
	extensions string,
	allowedDirectories []string,
	allowedPaths []string,
) (resolvedSecurityProfile, error) {
	profile := securityProfile(strings.ToLower(strings.TrimSpace(name)))
	resolved := resolvedSecurityProfile{name: profile, databaseDSN: databaseDSN}

	switch profile {
	case securityProfileCompat:
		if len(allowedDirectories) > 0 || len(allowedPaths) > 0 {
			return resolved, errors.New("allowed-directory and allowed-path require the local-files security profile")
		}
		return resolved, nil

	case securityProfileCatalogOnly, securityProfileLocalFiles:
		if strings.TrimSpace(extensions) != "" {
			return resolved, errors.New("load-extensions is incompatible with locked security profiles")
		}

	case "":
		return resolved, errors.New("security profile is blank")

	default:
		return resolved, fmt.Errorf("unknown security profile %q", name)
	}

	if profile == securityProfileCatalogOnly && (len(allowedDirectories) > 0 || len(allowedPaths) > 0) {
		return resolved, errors.New("catalog-only does not accept allowed-directory or allowed-path")
	}
	if err := validateLocalDatabaseDSN(databaseDSN); err != nil {
		return resolved, err
	}
	if err := rejectProfileSettings(databaseDSN); err != nil {
		return resolved, err
	}

	var err error
	resolved.allowedDirectories, err = canonicalLocalPaths(allowedDirectories, true)
	if err != nil {
		return resolved, fmt.Errorf("invalid allowed directory: %w", err)
	}
	resolved.allowedPaths, err = canonicalLocalPaths(allowedPaths, false)
	if err != nil {
		return resolved, fmt.Errorf("invalid allowed path: %w", err)
	}
	if profile == securityProfileLocalFiles && len(resolved.allowedDirectories) == 0 && len(resolved.allowedPaths) == 0 {
		return resolved, errors.New("local-files requires at least one allowed-directory or allowed-path")
	}

	resolved.databaseDSN, err = addDuckDBSettings(databaseDSN, strictProfileSettings)
	if err != nil {
		return resolved, err
	}
	return resolved, nil
}

type securityProfileInitializer struct {
	once               sync.Once
	err                error
	allowedDirectories []string
	allowedPaths       []string
}

func (p resolvedSecurityProfile) newConnectionInitializer() *securityProfileInitializer {
	if p.name == securityProfileCompat {
		return nil
	}
	return &securityProfileInitializer{
		allowedDirectories: append([]string(nil), p.allowedDirectories...),
		allowedPaths:       append([]string(nil), p.allowedPaths...),
	}
}

func (p *securityProfileInitializer) initializeConnection(
	ctx context.Context,
	execer driver.ExecerContext,
) error {
	if ctx == nil {
		return errors.New("security profile: nil context")
	}
	if execer == nil {
		return errors.New("security profile: nil execer")
	}
	p.once.Do(func() {
		settings := []duckDBSetting{
			{name: "temp_directory", value: "''"},
			{name: "allowed_directories", value: duckDBStringList(p.allowedDirectories)},
			{name: "allowed_paths", value: duckDBStringList(p.allowedPaths)},
			{name: "enable_external_access", value: "false"},
			{name: "lock_configuration", value: "true"},
		}
		for _, setting := range settings {
			_, err := execer.ExecContext(
				ctx,
				"SET "+setting.name+" = "+setting.value,
				nil,
			)
			if err != nil {
				p.err = fmt.Errorf("failed to set %s: %w", setting.name, err)
				return
			}
		}
	})
	return p.err
}

func validateLocalDatabaseDSN(databaseDSN string) error {
	database, _, _ := strings.Cut(databaseDSN, "?")
	if database == "" || database == ":memory:" || hasWindowsDrivePrefix(database) {
		return nil
	}
	if isNetworkPath(database) {
		return fmt.Errorf("database path %q is not a local filesystem path", database)
	}
	parsed, err := url.Parse(database)
	if err != nil {
		return fmt.Errorf("invalid database path %q: %w", database, err)
	}
	if parsed.Scheme != "" || parsed.Host != "" {
		return fmt.Errorf("database path %q is not a local filesystem path", database)
	}
	return nil
}

func hasWindowsDrivePrefix(path string) bool {
	if len(path) < 2 || path[1] != ':' {
		return false
	}
	letter := path[0]
	return letter >= 'a' && letter <= 'z' || letter >= 'A' && letter <= 'Z'
}

func isNetworkPath(path string) bool {
	return strings.HasPrefix(path, `\\`) || strings.HasPrefix(path, "//")
}

func addDuckDBSettings(databaseDSN string, settings []duckDBSetting) (string, error) {
	database, rawQuery, _ := strings.Cut(databaseDSN, "?")
	query, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "", fmt.Errorf("invalid database configuration: %w", err)
	}
	for _, setting := range settings {
		query.Set(setting.name, setting.value)
	}
	return database + "?" + query.Encode(), nil
}

func canonicalLocalPaths(values []string, directories bool) ([]string, error) {
	paths := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			return nil, errors.New("path is blank")
		}
		parsed, err := url.Parse(value)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		if isNetworkPath(value) || parsed.Scheme != "" && !hasWindowsDrivePrefix(value) {
			return nil, fmt.Errorf("%q is not a local filesystem path", value)
		}

		absolute, err := filepath.Abs(value)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		absolute, err = filepath.EvalSymlinks(absolute)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		info, err := os.Stat(absolute)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		if directories != info.IsDir() {
			kind := "file"
			if directories {
				kind = "directory"
			}
			return nil, fmt.Errorf("%q is not a %s", value, kind)
		}
		if _, ok := seen[absolute]; ok {
			continue
		}
		seen[absolute] = struct{}{}
		paths = append(paths, absolute)
	}
	return paths, nil
}

func duckDBStringList(values []string) string {
	quoted := make([]string, len(values))
	for i, value := range values {
		quoted[i] = "'" + strings.ReplaceAll(value, "'", "''") + "'"
	}
	return "[" + strings.Join(quoted, ",") + "]"
}

func rejectProfileSettings(databaseDSN string) error {
	_, rawQuery, _ := strings.Cut(databaseDSN, "?")
	query, err := url.ParseQuery(rawQuery)
	if err != nil {
		return fmt.Errorf("invalid database configuration: %w", err)
	}
	settings := []string{
		"allowed_directories",
		"allowed_paths",
		"enable_external_access",
		"lock_configuration",
		"temp_directory",
	}
	for _, setting := range strictProfileSettings {
		settings = append(settings, setting.name)
	}
	for existing := range query {
		for _, setting := range settings {
			if strings.EqualFold(existing, setting) {
				return fmt.Errorf("database configuration %q is owned by the security profile", existing)
			}
		}
	}
	return nil
}
