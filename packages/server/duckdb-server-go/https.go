package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/smallstep/truststore"
)

const renewBefore = 30 * 24 * time.Hour

func configureHTTPS(enabled bool, address, certFile, keyFile string, logger *slog.Logger) (*tls.Config, error) {
	if (certFile == "") != (keyFile == "") {
		return nil, errors.New("both --cert and --key are required for HTTPS")
	}
	if certFile == "" {
		_, certErr := os.Stat("localhost.pem")
		_, keyErr := os.Stat("localhost-key.pem")
		if certErr == nil && keyErr == nil {
			certFile, keyFile = "localhost.pem", "localhost-key.pem"
			if enabled {
				logger.Warn("existing localhost certificate files override --https automatic certificate management; move them aside to use managed certificates", "cert", certFile, "key", keyFile)
			}
		}
	}
	if certFile != "" {
		cert, err := tls.LoadX509KeyPair(certFile, keyFile)
		if err != nil {
			return nil, fmt.Errorf("load TLS certificate: %w", err)
		}
		logger.Info("using TLS certificate", "cert", certFile)
		return &tls.Config{MinVersion: tls.VersionTLS12, Certificates: []tls.Certificate{cert}}, nil
	}
	if !enabled {
		return nil, nil
	}
	if address != "localhost" && address != "127.0.0.1" && address != "::1" {
		return nil, errors.New("managed HTTPS requires --address localhost, 127.0.0.1, or ::1; use --cert and --key for other addresses")
	}
	dir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}
	dir = filepath.Join(dir, "mosaic", "duckdb-server-go", "https")
	local, err := newLocalHTTPS(dir, time.Now)
	if err != nil {
		return nil, err
	}
	if err := installLocalTrust(local.ca, dir, logger); err != nil {
		return nil, err
	}
	logger.Info("managed localhost HTTPS ready", "directory", dir)
	return &tls.Config{MinVersion: tls.VersionTLS12, GetCertificate: local.getCertificate}, nil
}

func installLocalTrust(ca *x509.Certificate, dir string, logger *slog.Logger) error {
	if _, err := ca.Verify(x509.VerifyOptions{}); err != nil {
		logger.Info("installing Mosaic localhost CA; the operating system may request administrator permission", "certificate", filepath.Join(dir, "ca.pem"))
		if err := truststore.Install(ca); err != nil {
			return fmt.Errorf("install localhost CA: %w; rerun --https in an interactive terminal with permission to update the system trust store, or use --cert and --key", err)
		}
	}
	if runtime.GOOS == "windows" {
		return nil
	}
	nss, err := truststore.NewNSSTrust()
	if err != nil {
		if hasNSSProfiles() {
			logger.Warn("NSS trust setup unavailable; browsers using a separate NSS store may require importing ca.pem or installing NSS certutil (brew install nss / apt install libnss3-tools) and restarting with --https", "error", err)
		} else {
			logger.Debug("NSS trust setup unavailable; no NSS profiles to configure", "error", err)
		}
		return nil
	}
	installNSSTrust(nss, ca, dir, logger)
	return nil
}

func hasNSSProfiles() bool {
	profiles, _ := filepath.Glob(truststore.NSSProfile)
	profiles = append(profiles, filepath.Join(os.Getenv("HOME"), ".pki", "nssdb"))
	for _, profile := range profiles {
		for _, name := range []string{"cert9.db", "cert8.db"} {
			if info, err := os.Stat(filepath.Join(profile, name)); err == nil && !info.IsDir() {
				return true
			}
		}
	}
	return false
}

func installNSSTrust(nss truststore.Trust, ca *x509.Certificate, dir string, logger *slog.Logger) {
	if err := nss.PreCheck(); err != nil {
		logger.Debug("no NSS profiles to configure", "error", err)
		return
	}
	if !nss.Exists(ca) {
		if err := nss.Install(filepath.Join(dir, "ca.pem"), ca); err != nil {
			logger.Warn("could not install localhost CA in NSS; close the browser and retry --https, or import the CA manually", "certificate", filepath.Join(dir, "ca.pem"), "error", err)
			return
		}
		logger.Info("installed localhost CA in NSS; restart the browser")
	}
}

type localHTTPS struct {
	mu   sync.Mutex
	dir  string
	ca   *x509.Certificate
	key  *ecdsa.PrivateKey
	cert *tls.Certificate
	now  func() time.Time
}

func newLocalHTTPS(dir string, now func() time.Time) (*localHTTPS, error) {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	if err := os.Chmod(dir, 0700); err != nil {
		return nil, err
	}
	ca, err := loadLocalPair(filepath.Join(dir, "ca-key.pem"))
	if errors.Is(err, os.ErrNotExist) {
		if _, certErr := os.Stat(filepath.Join(dir, "ca.pem")); !errors.Is(certErr, os.ErrNotExist) {
			// Another process may have published both CA files since our first read.
			ca, err = loadLocalPair(filepath.Join(dir, "ca-key.pem"))
			if err != nil {
				return nil, fmt.Errorf("localhost CA key is missing or unreadable; restore ca-key.pem in %s or remove the old CA from your trust stores and move the directory aside before rerunning --https: %w", dir, err)
			}
		} else {
			ca, err = createLocalPair(filepath.Join(dir, "ca-key.pem"), nil, nil, now())
		}
	}
	if err != nil {
		return nil, fmt.Errorf("load localhost CA: %w", err)
	}
	key, ok := ca.PrivateKey.(*ecdsa.PrivateKey)
	if !ok || !ca.Leaf.IsCA || ca.Leaf.CheckSignatureFrom(ca.Leaf) != nil {
		return nil, errors.New("invalid managed localhost CA")
	}
	if now().Before(ca.Leaf.NotBefore) || !now().Add(renewBefore).Before(ca.Leaf.NotAfter) {
		return nil, fmt.Errorf("localhost CA is not valid for renewal; remove the old Mosaic CA from your trust stores, move %s aside, then rerun --https to create and trust a new CA", dir)
	}
	if err := saveLocalPair(filepath.Join(dir, "ca.pem"), pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: ca.Leaf.Raw}), false); err != nil {
		return nil, err
	}
	local := &localHTTPS{dir: dir, ca: ca.Leaf, key: key, now: now}
	local.cert, err = loadLocalPair(filepath.Join(dir, "localhost.pem"))
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("load managed localhost certificate: %w; if the file is corrupt, remove %s and rerun --https to regenerate it with the existing CA", err, filepath.Join(dir, "localhost.pem"))
	}
	if _, err := local.getCertificate(nil); err != nil {
		return nil, err
	}
	return local, nil
}

func (l *localHTTPS) getCertificate(_ *tls.ClientHelloInfo) (*tls.Certificate, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	if now.Before(l.ca.NotBefore) || !now.Add(renewBefore).Before(l.ca.NotAfter) {
		return nil, errors.New("localhost CA is not valid for renewal; restart --https for recovery instructions")
	}
	if l.cert != nil && now.After(l.cert.Leaf.NotBefore) && now.Add(renewBefore).Before(l.cert.Leaf.NotAfter) && l.cert.Leaf.CheckSignatureFrom(l.ca) == nil {
		valid := true
		for _, host := range []string{"localhost", "127.0.0.1", "::1"} {
			valid = valid && l.cert.Leaf.VerifyHostname(host) == nil
		}
		if valid {
			return l.cert, nil
		}
	}
	cert, err := createLocalPair(filepath.Join(l.dir, "localhost.pem"), l.ca, l.key, now)
	if err != nil {
		return nil, fmt.Errorf("renew localhost certificate: %w", err)
	}
	l.cert = cert
	return cert, nil
}

func loadLocalPair(path string) (*tls.Certificate, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	cert, err := tls.X509KeyPair(data, data)
	if err != nil {
		return nil, err
	}
	cert.Leaf, err = x509.ParseCertificate(cert.Certificate[0])
	return &cert, err
}

func createLocalPair(path string, ca *x509.Certificate, caKey *ecdsa.PrivateKey, now time.Time) (*tls.Certificate, error) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return nil, err
	}
	template := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{CommonName: "Mosaic localhost"},
		NotBefore:             now.Add(-5 * time.Minute),
		NotAfter:              now.Add(90 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}
	if ca == nil {
		template.Subject.CommonName = "Mosaic localhost development CA"
		template.NotAfter = now.AddDate(10, 0, 0)
		template.IsCA = true
		template.MaxPathLenZero = true
		template.KeyUsage |= x509.KeyUsageCertSign | x509.KeyUsageCRLSign
		template.PermittedDNSDomainsCritical = true
		template.PermittedDNSDomains = []string{"localhost"}
		template.ExcludedDNSDomains = []string{".localhost"}
		template.PermittedIPRanges = []*net.IPNet{
			{IP: net.ParseIP("127.0.0.1"), Mask: net.CIDRMask(32, 32)},
			{IP: net.ParseIP("::1"), Mask: net.CIDRMask(128, 128)},
		}
		ca, caKey = template, key
	} else {
		template.DNSNames = []string{"localhost"}
		template.IPAddresses = []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")}
		if template.NotAfter.After(ca.NotAfter) {
			template.NotAfter = ca.NotAfter
		}
	}
	der, err := x509.CreateCertificate(rand.Reader, template, ca, &key.PublicKey, caKey)
	if err != nil {
		return nil, err
	}
	keyDER, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		return nil, err
	}
	data := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	data = append(data, pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyDER})...)
	if err := saveLocalPair(path, data, template.IsCA); err != nil {
		return nil, err
	}
	return loadLocalPair(path)
}

func saveLocalPair(path string, data []byte, exclusive bool) error {
	f, err := os.CreateTemp(filepath.Dir(path), ".certificate-*")
	if err != nil {
		return err
	}
	defer func() { _ = os.Remove(f.Name()) }()
	_, writeErr := f.Write(data)
	closeErr := f.Close()
	if err := errors.Join(writeErr, closeErr); err != nil {
		return err
	}
	if exclusive {
		// Publish the CA without replacing another process's newly created trust anchor.
		if err := os.Link(f.Name(), path); err != nil && !errors.Is(err, os.ErrExist) {
			return err
		}
		return nil
	}
	return os.Rename(f.Name(), path)
}

func normalizeAddress(address string) string {
	if strings.HasPrefix(address, "[") && strings.HasSuffix(address, "]") {
		if host := address[1 : len(address)-1]; net.ParseIP(host) != nil {
			return host
		}
	}
	return address
}
