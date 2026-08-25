package main

import (
	"errors"
	"fmt"
	"strings"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/connector"
)

type securityProfile string

const (
	securityProfileCompat      securityProfile = "compat"
	securityProfileCatalogOnly securityProfile = "catalog-only"
	securityProfileLocalFiles  securityProfile = "local-files"
)

type resolvedSecurityProfile struct {
	name   securityProfile
	policy *connector.ResourcePolicy
}

func resolveSecurityProfile(
	name string,
	extensions string,
	allowedDirectories []string,
	allowedPaths []string,
) (resolvedSecurityProfile, error) {
	profile := securityProfile(strings.ToLower(strings.TrimSpace(name)))
	resolved := resolvedSecurityProfile{name: profile}

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

	if profile == securityProfileCatalogOnly {
		if len(allowedDirectories) > 0 || len(allowedPaths) > 0 {
			return resolved, errors.New("catalog-only does not accept allowed-directory or allowed-path")
		}
		resolved.policy = connector.CatalogOnly()
		return resolved, nil
	}
	if len(allowedDirectories) == 0 && len(allowedPaths) == 0 {
		return resolved, errors.New("local-files requires at least one allowed-directory or allowed-path")
	}

	resolved.policy = connector.LocalFiles(connector.LocalFilesOptions{
		AllowedDirectories: allowedDirectories,
		AllowedPaths:       allowedPaths,
	})
	return resolved, nil
}
