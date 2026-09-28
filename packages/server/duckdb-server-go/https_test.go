package main

import (
	"crypto/tls"
	"crypto/x509"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestLocalHTTPSReuseAndRenewal(t *testing.T) {
	dir := t.TempDir()
	now := time.Now()
	clock := func() time.Time { return now }
	local, err := newLocalHTTPS(dir, clock)
	require.NoError(t, err)
	root := append([]byte(nil), local.ca.Raw...)
	original := append([]byte(nil), local.cert.Certificate[0]...)
	roots := x509.NewCertPool()
	roots.AddCert(local.ca)
	for _, host := range []string{"localhost", "127.0.0.1", "::1"} {
		_, err := local.cert.Leaf.Verify(x509.VerifyOptions{Roots: roots, DNSName: host, CurrentTime: now})
		require.NoError(t, err)
	}
	require.Error(t, local.cert.Leaf.VerifyHostname("example.com"))
	require.Error(t, local.cert.Leaf.VerifyHostname("127.0.0.2"))
	publicCA, err := os.ReadFile(filepath.Join(dir, "ca.pem"))
	require.NoError(t, err)
	require.NotContains(t, string(publicCA), "PRIVATE KEY")
	if runtime.GOOS != "windows" {
		for _, name := range []string{"ca.pem", "ca-key.pem", "localhost.pem"} {
			info, err := os.Stat(filepath.Join(dir, name))
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0600), info.Mode().Perm())
		}
		info, err := os.Stat(dir)
		require.NoError(t, err)
		require.Equal(t, os.FileMode(0700), info.Mode().Perm())
	}
	local, err = newLocalHTTPS(dir, clock)
	require.NoError(t, err)
	require.Equal(t, root, local.ca.Raw)
	require.Equal(t, original, local.cert.Certificate[0])
	now = now.Add(61 * 24 * time.Hour)
	var wg sync.WaitGroup
	for range 10 {
		wg.Go(func() {
			cert, err := local.getCertificate(nil)
			if err != nil {
				t.Error(err)
				return
			}
			if _, err := cert.Leaf.Verify(x509.VerifyOptions{Roots: roots, DNSName: "localhost", CurrentTime: now}); err != nil {
				t.Error(err)
			}
		})
	}
	wg.Wait()
	require.NotEqual(t, original, local.cert.Certificate[0])
	require.Equal(t, root, local.ca.Raw)
	renewed := local.cert.Certificate[0]
	local, err = newLocalHTTPS(dir, clock)
	require.NoError(t, err)
	require.Equal(t, renewed, local.cert.Certificate[0])
	now = now.Add(100 * 24 * time.Hour)
	local, err = newLocalHTTPS(dir, clock)
	require.NoError(t, err)
	require.NotEqual(t, renewed, local.cert.Certificate[0])
	require.Equal(t, root, local.ca.Raw)
}

func TestLocalHTTPSConcurrentCreation(t *testing.T) {
	dir := t.TempDir()
	var wg sync.WaitGroup
	roots := make(chan []byte, 8)
	for range 8 {
		wg.Go(func() {
			local, err := newLocalHTTPS(dir, time.Now)
			if err != nil {
				t.Error(err)
				return
			}
			if err := local.cert.Leaf.CheckSignatureFrom(local.ca); err != nil {
				t.Error(err)
			}
			roots <- local.ca.Raw
		})
	}
	wg.Wait()
	close(roots)
	local, err := newLocalHTTPS(dir, time.Now)
	require.NoError(t, err)
	for root := range roots {
		require.Equal(t, root, local.ca.Raw)
	}
}

func TestLocalHTTPSRejectsDamagedState(t *testing.T) {
	for _, name := range []string{"ca-key.pem", "localhost.pem"} {
		t.Run(name, func(t *testing.T) {
			dir := t.TempDir()
			_, err := newLocalHTTPS(dir, time.Now)
			require.NoError(t, err)
			path := filepath.Join(dir, name)
			require.NoError(t, os.WriteFile(path, []byte("broken"), 0600))
			_, err = newLocalHTTPS(dir, time.Now)
			require.Error(t, err)
			data, err := os.ReadFile(path)
			require.NoError(t, err)
			require.Equal(t, "broken", string(data))
		})
	}
	t.Run("missing CA key", func(t *testing.T) {
		dir := t.TempDir()
		_, err := newLocalHTTPS(dir, time.Now)
		require.NoError(t, err)
		require.NoError(t, os.Remove(filepath.Join(dir, "ca-key.pem")))
		_, err = newLocalHTTPS(dir, time.Now)
		require.ErrorContains(t, err, "CA key is missing")
	})
	t.Run("expired CA", func(t *testing.T) {
		dir := t.TempDir()
		local, err := newLocalHTTPS(dir, time.Now)
		require.NoError(t, err)
		_, err = newLocalHTTPS(dir, func() time.Time { return local.ca.NotAfter })
		require.ErrorContains(t, err, "remove the old Mosaic CA")
	})
}

func TestConfigureHTTPS(t *testing.T) {
	t.Chdir(t.TempDir())
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	config, err := configureHTTPS(false, "localhost", "", "", logger)
	require.NoError(t, err)
	require.Nil(t, config)
	for _, address := range []string{"0.0.0.0", "::", "example.com", "127.0.0.2"} {
		_, err := configureHTTPS(true, address, "", "", logger)
		require.ErrorContains(t, err, "managed HTTPS requires")
	}
	for _, enabled := range []bool{false, true} {
		_, err := configureHTTPS(enabled, "localhost", "cert.pem", "", logger)
		require.ErrorContains(t, err, "both --cert and --key")
		_, err = configureHTTPS(enabled, "localhost", "", "key.pem", logger)
		require.ErrorContains(t, err, "both --cert and --key")
	}
	local, err := newLocalHTTPS(t.TempDir(), time.Now)
	require.NoError(t, err)
	path := filepath.Join(local.dir, "localhost.pem")
	config, err = configureHTTPS(true, "0.0.0.0", path, path, logger)
	require.NoError(t, err)
	require.Len(t, config.Certificates, 1)
	require.Nil(t, config.GetCertificate)
	data, err := os.ReadFile(path)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile("localhost.pem", data, 0600))
	require.NoError(t, os.WriteFile("localhost-key.pem", data, 0600))
	for _, enabled := range []bool{false, true} {
		config, err = configureHTTPS(enabled, "localhost", "", "", logger)
		require.NoError(t, err)
		require.Equal(t, local.cert.Certificate, config.Certificates[0].Certificate)
	}
}

func TestLocalHTTPSNegotiatesHTTP2(t *testing.T) {
	local, err := newLocalHTTPS(t.TempDir(), time.Now)
	require.NoError(t, err)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	server := &http.Server{
		TLSConfig: &tls.Config{MinVersion: tls.VersionTLS12, GetCertificate: local.getCertificate},
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	}
	done := make(chan error, 1)
	go func() { done <- server.ServeTLS(listener, "", "") }()
	t.Cleanup(func() {
		require.NoError(t, server.Close())
		require.ErrorIs(t, <-done, http.ErrServerClosed)
	})
	roots := x509.NewCertPool()
	roots.AddCert(local.ca)
	transport := &http.Transport{ForceAttemptHTTP2: true, TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: roots}}
	t.Cleanup(transport.CloseIdleConnections)
	client := &http.Client{Transport: transport, Timeout: 5 * time.Second}
	response, err := client.Get("https://" + listener.Addr().String())
	require.NoError(t, err)
	require.NoError(t, response.Body.Close())
	require.Equal(t, http.StatusNoContent, response.StatusCode)
	require.Equal(t, 2, response.ProtoMajor)
}
