package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"io"
	"log/slog"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func writeTestPair(t *testing.T, dir string) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	leaf := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(90 * 24 * time.Hour),
		DNSNames: []string{"localhost"}, IPAddresses: []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")}}
	der, err := x509.CreateCertificate(rand.Reader, leaf, leaf, &key.PublicKey, key)
	require.NoError(t, err)
	keyDER, err := x509.MarshalPKCS8PrivateKey(key)
	require.NoError(t, err)
	require.NoError(t, os.MkdirAll(dir, 0700))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "localhost.pem"), pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0600))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "localhost-key.pem"), pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyDER}), 0600))
}

func TestConfigureHTTPS(t *testing.T) {
	t.Chdir(t.TempDir())
	home := t.TempDir()
	for _, variable := range []string{"HOME", "XDG_CONFIG_HOME", "APPDATA"} {
		t.Setenv(variable, home)
	}
	configDir, err := os.UserConfigDir()
	require.NoError(t, err)
	shared := filepath.Join(configDir, "mosaic", "https")
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	config, err := configureHTTPS("", "", logger)
	require.NoError(t, err)
	require.Nil(t, config)
	_, err = configureHTTPS("cert.pem", "", logger)
	require.ErrorContains(t, err, "both --cert and --key")
	_, err = configureHTTPS("", "key.pem", logger)
	require.ErrorContains(t, err, "both --cert and --key")
	writeTestPair(t, shared)
	sharedConfig, err := configureHTTPS("", "", logger)
	require.NoError(t, err)
	require.NotNil(t, sharedConfig)
	require.NoError(t, os.WriteFile("localhost.pem", []byte("incomplete"), 0600))
	config, err = configureHTTPS("", "", logger)
	require.NoError(t, err)
	require.Equal(t, sharedConfig.Certificates, config.Certificates)
	require.NoError(t, os.WriteFile("localhost-key.pem", []byte("broken"), 0600))
	_, err = configureHTTPS("", "", logger)
	require.ErrorContains(t, err, "load TLS certificate")
	writeTestPair(t, ".")
	config, err = configureHTTPS("", "", logger)
	require.NoError(t, err)
	require.NotEqual(t, sharedConfig.Certificates, config.Certificates)
	config, err = configureHTTPS(filepath.Join(shared, "localhost.pem"), filepath.Join(shared, "localhost-key.pem"), logger)
	require.NoError(t, err)
	require.Equal(t, sharedConfig.Certificates, config.Certificates)
	_, err = configureHTTPS("localhost.pem", filepath.Join(shared, "localhost-key.pem"), logger)
	require.ErrorContains(t, err, "load TLS certificate")
	_, err = configureHTTPS("missing.pem", "missing-key.pem", logger)
	require.ErrorContains(t, err, "load TLS certificate")
}

func TestNormalizeAddress(t *testing.T) {
	for input, expected := range map[string]string{
		"localhost": "localhost", "127.0.0.1": "127.0.0.1", "::1": "::1", "[::1]": "::1", "[bad]": "[bad]",
	} {
		require.Equal(t, expected, normalizeAddress(input))
	}
}
