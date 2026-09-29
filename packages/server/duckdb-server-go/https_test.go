package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"io"
	"log/slog"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func writeTestPair(t *testing.T, dir string, expires time.Time) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	leaf := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now().Add(-time.Hour), NotAfter: expires,
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
	config, err := configureHTTPS(false, "localhost", "", "", logger)
	require.NoError(t, err)
	require.Nil(t, config)
	_, err = configureHTTPS(true, "0.0.0.0", "", "", logger)
	require.ErrorContains(t, err, "mkcert HTTPS requires")
	for _, enabled := range []bool{false, true} {
		_, err = configureHTTPS(enabled, "localhost", "cert.pem", "", logger)
		require.ErrorContains(t, err, "both --cert and --key")
	}
	writeTestPair(t, shared, time.Now().Add(90*24*time.Hour))
	sharedConfig, err := configureHTTPS(false, "localhost", "", "", logger)
	require.NoError(t, err)
	require.NotNil(t, sharedConfig)
	require.NoError(t, os.WriteFile("localhost.pem", []byte("incomplete"), 0600))
	config, err = configureHTTPS(false, "localhost", "", "", logger)
	require.NoError(t, err)
	require.Equal(t, sharedConfig.Certificates, config.Certificates)
	require.NoError(t, os.WriteFile("localhost-key.pem", []byte("broken"), 0600))
	_, err = configureHTTPS(false, "localhost", "", "", logger)
	require.ErrorContains(t, err, "load TLS certificate")
	writeTestPair(t, ".", time.Now().Add(90*24*time.Hour))
	for _, enabled := range []bool{false, true} {
		config, err = configureHTTPS(enabled, "0.0.0.0", "", "", logger)
		require.NoError(t, err)
		require.NotEqual(t, sharedConfig.Certificates, config.Certificates)
		config, err = configureHTTPS(enabled, "0.0.0.0", filepath.Join(shared, "localhost.pem"), filepath.Join(shared, "localhost-key.pem"), logger)
		require.NoError(t, err)
		require.Equal(t, sharedConfig.Certificates, config.Certificates)
	}

	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	server.TLS = config
	server.EnableHTTP2 = true
	server.StartTLS()
	defer server.Close()
	response, err := server.Client().Get(server.URL)
	require.NoError(t, err)
	require.NoError(t, response.Body.Close())
	require.Equal(t, 2, response.ProtoMajor)
}

func TestSetupCertificates(t *testing.T) {
	dir := t.TempDir()
	calls := [][]string{}
	run := func(binary string, args ...string) error {
		require.Equal(t, "mkcert", binary)
		calls = append(calls, args)
		if args[0] == "-cert-file" {
			require.Equal(t, []string{"localhost", "127.0.0.1", "::1"}, args[4:])
			writeTestPair(t, filepath.Dir(args[1]), time.Now().Add(90*24*time.Hour))
		}
		return nil
	}
	require.NoError(t, setupCertificates(dir, "mkcert", run))
	require.Len(t, calls, 2)
	require.True(t, reusablePair(dir, time.Now()))
	require.NoError(t, setupCertificates(dir, "mkcert", run))
	require.Len(t, calls, 3)
	writeTestPair(t, dir, time.Now().Add(10*24*time.Hour))
	original, err := os.ReadFile(filepath.Join(dir, "localhost.pem"))
	require.NoError(t, err)
	require.Error(t, setupCertificates(dir, "mkcert", func(_ string, args ...string) error {
		if args[0] == "-install" {
			return nil
		}
		return errors.New("generation failed")
	}))
	unchanged, err := os.ReadFile(filepath.Join(dir, "localhost.pem"))
	require.NoError(t, err)
	require.Equal(t, original, unchanged)
	require.NoError(t, setupCertificates(dir, "mkcert", run))
	require.True(t, reusablePair(dir, time.Now()))
	other := t.TempDir()
	writeTestPair(t, other, time.Now().Add(90*24*time.Hour))
	key, err := os.ReadFile(filepath.Join(other, "localhost-key.pem"))
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(filepath.Join(dir, "localhost-key.pem"), key, 0600))
	require.False(t, reusablePair(dir, time.Now()))
	require.NoError(t, setupCertificates(dir, "mkcert", run))
	_, err = tls.LoadX509KeyPair(filepath.Join(dir, "localhost.pem"), filepath.Join(dir, "localhost-key.pem"))
	require.NoError(t, err)
}

func TestNormalizeAddress(t *testing.T) {
	for input, expected := range map[string]string{
		"localhost": "localhost", "127.0.0.1": "127.0.0.1", "::1": "::1", "[::1]": "::1", "[bad]": "[bad]",
	} {
		require.Equal(t, expected, normalizeAddress(input))
	}
}

func TestFindMkcert(t *testing.T) {
	t.Setenv("PATH", "")
	home := t.TempDir()
	for _, variable := range []string{"HOME", "XDG_CACHE_HOME", "LOCALAPPDATA"} {
		t.Setenv(variable, home)
	}
	_, err := findMkcert()
	require.ErrorContains(t, err, "pnpm mkcert")
	cache, err := os.UserCacheDir()
	require.NoError(t, err)
	cache = filepath.Join(cache, "mosaic", "mkcert")
	require.NoError(t, os.MkdirAll(cache, 0700))
	name := "mkcert-v1.4.4-" + runtime.GOOS + "-" + runtime.GOARCH
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	require.NoError(t, os.WriteFile(filepath.Join(cache, name), []byte("corrupt"), 0700))
	_, err = findMkcert()
	require.ErrorContains(t, err, "checksum mismatch")
}
