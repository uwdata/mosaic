package server

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
)

func WithCacheControl(value string) Option {
	return optionFunc(func(cfg *config) error {
		for i := range len(value) {
			if c := value[i]; c < 0x20 && c != '\t' || c == 0x7f {
				return errors.New("server: Cache-Control contains an invalid header character")
			}
		}
		cfg.cacheControl = strings.TrimSpace(value)
		return nil
	})
}

func WithVary(headers ...string) Option {
	headers = append([]string(nil), headers...)
	return optionFunc(func(cfg *config) error {
		names, err := copyNonEmpty("Vary header", headers, false)
		if err != nil {
			return err
		}
		unique := names[:0]
		for _, name := range names {
			for _, c := range name {
				if c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || strings.ContainsRune("!#$%&'*+-.^_`|~", c) {
					continue
				}
				return fmt.Errorf("server: invalid Vary header %q", name)
			}
			name = http.CanonicalHeaderKey(name)
			if !slices.Contains(unique, name) {
				unique = append(unique, name)
			}
		}
		cfg.varyHeaders = unique
		return nil
	})
}

func responseETag(response commandResponse) string {
	hash := sha256.New()
	_, _ = hash.Write([]byte(response.contentType))
	_, _ = hash.Write([]byte{0})
	_, _ = hash.Write(response.data)
	return `"` + hex.EncodeToString(hash.Sum(nil)) + `"`
}

// Entity tags can contain commas: https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3
func matchesETag(value, etag string, weak bool) bool {
	value = strings.Trim(value, " \t")
	if value == "*" {
		return true
	}
	matched := false
	for value != "" {
		value = strings.TrimLeft(value, " \t,")
		if value == "" {
			break
		}
		tag, isWeak := strings.CutPrefix(value, "W/")
		if len(tag) == 0 || tag[0] != '"' {
			return false
		}
		end := 1
		for end < len(tag) && tag[end] != '"' {
			if tag[end] < 0x21 || tag[end] == 0x7f {
				return false
			}
			end++
		}
		if end == len(tag) {
			return false
		}
		matched = matched || (weak || !isWeak) && tag[:end+1] == etag
		value = strings.TrimLeft(tag[end+1:], " \t")
		if value != "" && value[0] != ',' {
			return false
		}
	}
	return matched
}
