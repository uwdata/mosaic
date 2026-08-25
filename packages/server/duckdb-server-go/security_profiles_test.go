package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolveSecurityProfile(t *testing.T) {
	tests := []struct {
		name       string
		profile    string
		extensions string
		dirs       []string
		paths      []string
		wantName   securityProfile
		wantPolicy bool
		wantErr    string
	}{
		{name: "compat", profile: "compat", wantName: securityProfileCompat},
		{name: "profile names are normalized", profile: " CATALOG-ONLY ", wantName: securityProfileCatalogOnly, wantPolicy: true},
		{name: "catalog only", profile: "catalog-only", wantName: securityProfileCatalogOnly, wantPolicy: true},
		{name: "local directory", profile: "local-files", dirs: []string{"data"}, wantName: securityProfileLocalFiles, wantPolicy: true},
		{name: "local path", profile: "local-files", paths: []string{"data.parquet"}, wantName: securityProfileLocalFiles, wantPolicy: true},
		{name: "unknown", profile: "remote-files", wantErr: "unknown security profile"},
		{name: "blank", profile: " ", wantErr: "security profile is blank"},
		{name: "compat paths", profile: "compat", dirs: []string{"data"}, wantErr: "require the local-files"},
		{name: "catalog paths", profile: "catalog-only", paths: []string{"data.parquet"}, wantErr: "catalog-only does not accept"},
		{name: "local needs paths", profile: "local-files", wantErr: "requires at least one"},
		{name: "locked extensions", profile: "catalog-only", extensions: "httpfs", wantErr: "load-extensions is incompatible"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := resolveSecurityProfile(tt.profile, tt.extensions, tt.dirs, tt.paths)
			if tt.wantErr != "" {
				require.ErrorContains(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantName, got.name)
			if tt.wantPolicy {
				assert.NotNil(t, got.policy)
			} else {
				assert.Nil(t, got.policy)
			}
		})
	}
}
