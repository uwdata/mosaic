package main

import (
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

func configureHTTPS(enabled bool, address, certFile, keyFile string, logger *slog.Logger) (*tls.Config, error) {
	if (certFile == "") != (keyFile == "") {
		return nil, errors.New("both --cert and --key are required for HTTPS")
	}
	if certFile == "" {
		certFile, keyFile = certificatePair(".")
	}
	if certFile == "" {
		config, err := os.UserConfigDir()
		if err != nil {
			if enabled {
				return nil, err
			}
			return nil, nil
		}
		dir := filepath.Join(config, "mosaic", "https")
		if enabled {
			if address != "localhost" && address != "127.0.0.1" && address != "::1" {
				return nil, errors.New("mkcert HTTPS requires --address localhost, 127.0.0.1, or ::1; use --cert and --key for other addresses")
			}
			binary, err := findMkcert()
			if err != nil {
				return nil, err
			}
			if err := setupCertificates(dir, binary, runMkcert); err != nil {
				return nil, err
			}
		}
		certFile, keyFile = certificatePair(dir)
	}
	if certFile == "" {
		return nil, nil
	}
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, fmt.Errorf("load TLS certificate %s and key %s: %w", certFile, keyFile, err)
	}
	logger.Info("using TLS certificate", "cert", certFile)
	return &tls.Config{MinVersion: tls.VersionTLS12, Certificates: []tls.Certificate{cert}}, nil
}

func certificatePair(dir string) (string, string) {
	cert, key := filepath.Join(dir, "localhost.pem"), filepath.Join(dir, "localhost-key.pem")
	_, certErr := os.Stat(cert)
	_, keyErr := os.Stat(key)
	if certErr == nil && keyErr == nil {
		return cert, key
	}
	return "", ""
}

func reusablePair(dir string, now time.Time) bool {
	cert, err := tls.LoadX509KeyPair(filepath.Join(dir, "localhost.pem"), filepath.Join(dir, "localhost-key.pem"))
	if err != nil {
		return false
	}
	leaf, err := x509.ParseCertificate(cert.Certificate[0])
	if err != nil || now.Before(leaf.NotBefore) || !now.Add(30*24*time.Hour).Before(leaf.NotAfter) {
		return false
	}
	for _, host := range []string{"localhost", "127.0.0.1", "::1"} {
		if leaf.VerifyHostname(host) != nil {
			return false
		}
	}
	return true
}

func setupCertificates(dir, binary string, run func(string, ...string) error) error {
	if err := run(binary, "-install"); err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	if err := os.Chmod(dir, 0700); err != nil {
		return err
	}
	if !reusablePair(dir, time.Now()) {
		temporary, err := os.MkdirTemp(dir, ".certificate-")
		if err != nil {
			return err
		}
		defer func() { _ = os.RemoveAll(temporary) }()
		if err := run(binary, "-cert-file", filepath.Join(temporary, "localhost.pem"), "-key-file", filepath.Join(temporary, "localhost-key.pem"), "localhost", "127.0.0.1", "::1"); err != nil {
			return err
		}
		if !reusablePair(temporary, time.Now()) {
			return errors.New("mkcert generated an invalid localhost certificate pair")
		}
		for _, name := range []string{"localhost.pem", "localhost-key.pem"} {
			if err := os.Chmod(filepath.Join(temporary, name), 0600); err != nil {
				return err
			}
			if err := os.Rename(filepath.Join(temporary, name), filepath.Join(dir, name)); err != nil {
				return err
			}
		}
	}
	return os.Chmod(filepath.Join(dir, "localhost-key.pem"), 0600)
}

func runMkcert(binary string, args ...string) error {
	cmd := exec.Command(binary, args...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mkcert %s failed; check system/NSS trust permissions: %w", args[0], err)
	}
	return nil
}

func findMkcert() (string, error) {
	if binary, err := exec.LookPath("mkcert"); err == nil {
		return binary, nil
	}
	cache, err := os.UserCacheDir()
	if err == nil {
		name := "mkcert-v1.4.4-" + runtime.GOOS + "-" + runtime.GOARCH
		if runtime.GOOS == "windows" {
			name += ".exe"
		}
		binary := filepath.Join(cache, "mosaic", "mkcert", name)
		data, err := os.ReadFile(binary)
		if err == nil {
			hashes := map[string]string{
				"darwin-amd64":  "a32dfab51f1845d51e810db8e47dcf0e6b51ae3422426514bf5a2b8302e97d4e",
				"darwin-arm64":  "c8af0df44bce04359794dad8ea28d750437411d632748049d08644ffb66a60c6",
				"linux-amd64":   "6d31c65b03972c6dc4a14ab429f2928300518b26503f58723e532d1b0a3bbb52",
				"linux-arm":     "2f22ff62dfc13357e147e027117724e7ce1ff810e30d2b061b05b668ecb4f1d7",
				"linux-arm64":   "b98f2cc69fd9147fe4d405d859c57504571adec0d3611c3eefd04107c7ac00d0",
				"windows-amd64": "d2660b50a9ed59eada480750561c96abc2ed4c9a38c6a24d93e30e0977631398",
				"windows-arm64": "793747256c562622d40127c8080df26add2fb44c50906ce9db63b42a5280582e",
			}
			if fmt.Sprintf("%x", sha256.Sum256(data)) != hashes[runtime.GOOS+"-"+runtime.GOARCH] {
				return "", errors.New("cached mkcert binary checksum mismatch")
			}
			return binary, nil
		}
	}
	return "", errors.New("mkcert not found; install https://github.com/FiloSottile/mkcert or run pnpm mkcert from the Mosaic repository")
}

func normalizeAddress(address string) string {
	if strings.HasPrefix(address, "[") && strings.HasSuffix(address, "]") {
		if host := address[1 : len(address)-1]; net.ParseIP(host) != nil {
			return host
		}
	}
	return address
}
