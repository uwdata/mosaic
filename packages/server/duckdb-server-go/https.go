package main

import (
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"os"
	"path/filepath"
	"strings"
)

func configureHTTPS(certFile, keyFile string, logger *slog.Logger) (*tls.Config, error) {
	if (certFile == "") != (keyFile == "") {
		return nil, errors.New("both --cert and --key are required for HTTPS")
	}
	if certFile == "" {
		certFile, keyFile = certificatePair(".")
	}
	if certFile == "" {
		if config, err := os.UserConfigDir(); err == nil {
			certFile, keyFile = certificatePair(filepath.Join(config, "mosaic", "https"))
		}
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

func normalizeAddress(address string) string {
	if strings.HasPrefix(address, "[") && strings.HasSuffix(address, "]") {
		if host := address[1 : len(address)-1]; net.ParseIP(host) != nil {
			return host
		}
	}
	return address
}
