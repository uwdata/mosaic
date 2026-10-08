package server

import (
	"bytes"
	"compress/gzip"
	"io"
	"maps"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/zstd"
	"github.com/stretchr/testify/require"
)

const largeQuery = "SELECT range AS value FROM range(2000)"

func TestHTTPResponseCompression(t *testing.T) {
	db := setupTestDB(t)
	handler, err := New(db, WithCacheControl("public, max-age=60"))
	require.NoError(t, err)
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	large := server.URL + "/?type=arrow&sql=" + url.QueryEscape(largeQuery)
	small := server.URL + "/?type=arrow&sql=SELECT+1+AS+value"

	do := func(method, uri, body string, headers http.Header) (*http.Response, []byte) {
		t.Helper()
		req, err := http.NewRequestWithContext(t.Context(), method, uri, strings.NewReader(body))
		require.NoError(t, err)
		maps.Copy(req.Header, headers)
		res, err := server.Client().Do(req)
		require.NoError(t, err)
		data, err := io.ReadAll(res.Body)
		require.NoError(t, res.Body.Close())
		require.NoError(t, err)
		return res, data
	}
	get := func(uri string, headers http.Header) (*http.Response, []byte) {
		t.Helper()
		return do(http.MethodGet, uri, "", headers)
	}
	identityHeaders := func(extra ...string) http.Header {
		h := http.Header{"Accept-Encoding": {"identity"}}
		for i := 0; i+1 < len(extra); i += 2 {
			h.Set(extra[i], extra[i+1])
		}
		return h
	}

	identity, plain := get(large, identityHeaders())
	require.Equal(t, http.StatusOK, identity.StatusCode)
	require.Empty(t, identity.Header.Get("Content-Encoding"))
	require.Greater(t, len(plain), gzhttp.DefaultMinSize)
	require.Len(t, arrowRows(t, plain), 2000)
	etag := identity.Header.Get("ETag")
	require.Regexp(t, `^"[0-9a-f]{64}"$`, etag)
	require.Contains(t, strings.Join(identity.Header.Values("Vary"), ","), "Accept-Encoding")

	wildcard, body := get(large, identityHeaders("If-None-Match", "*"))
	require.Equal(t, http.StatusNotModified, wildcard.StatusCode)
	require.Empty(t, body)
	require.Equal(t, etag, wildcard.Header.Get("ETag"))

	decoders := map[string]func([]byte) ([]byte, error){
		"gzip": func(data []byte) ([]byte, error) {
			reader, err := gzip.NewReader(bytes.NewReader(data))
			if err != nil {
				return nil, err
			}
			return io.ReadAll(reader)
		},
		"zstd": func(data []byte) ([]byte, error) {
			decoder, err := zstd.NewReader(nil, zstd.WithDecoderConcurrency(1))
			if err != nil {
				return nil, err
			}
			defer decoder.Close()
			return decoder.DecodeAll(data, nil)
		},
	}
	for encoding, decode := range decoders {
		t.Run(encoding, func(t *testing.T) {
			headers := func(extra ...string) http.Header {
				h := http.Header{"Accept-Encoding": {encoding}}
				for i := 0; i+1 < len(extra); i += 2 {
					h.Set(extra[i], extra[i+1])
				}
				return h
			}

			res, body := get(large, headers())
			require.Equal(t, http.StatusOK, res.StatusCode)
			require.Equal(t, encoding, res.Header.Get("Content-Encoding"))
			require.Equal(t, arrowContentType, res.Header.Get("Content-Type"))
			require.Contains(t, strings.Join(res.Header.Values("Vary"), ","), "Accept-Encoding")
			require.Less(t, len(body), len(plain))
			decoded, err := decode(body)
			require.NoError(t, err)
			require.Equal(t, plain, decoded)
			suffixed := res.Header.Get("ETag")
			require.Equal(t, strings.TrimSuffix(etag, `"`)+"-"+encoding+`"`, suffixed)

			revalidated, body := get(large, headers("If-None-Match", suffixed))
			require.Equal(t, http.StatusNotModified, revalidated.StatusCode)
			require.Empty(t, body)
			require.Equal(t, suffixed, revalidated.Header.Get("ETag"))
			require.Empty(t, revalidated.Header.Get("Content-Encoding"))
			require.Equal(t, res.Header.Values("Cache-Control"), revalidated.Header.Values("Cache-Control"))
			require.Equal(t, res.Header.Values("Vary"), revalidated.Header.Values("Vary"))

			wildcard, body := get(large, headers("If-None-Match", "*"))
			require.Equal(t, http.StatusNotModified, wildcard.StatusCode)
			require.Empty(t, body)
			require.Equal(t, suffixed, wildcard.Header.Get("ETag"))

			otherRepresentation, body := get(large, headers("If-None-Match", etag))
			require.Equal(t, http.StatusOK, otherRepresentation.StatusCode)
			require.Equal(t, encoding, otherRepresentation.Header.Get("Content-Encoding"))
			require.Equal(t, suffixed, otherRepresentation.Header.Get("ETag"))
			require.NotEmpty(t, body)

			matched, _ := get(large, headers("If-Match", suffixed))
			require.Equal(t, http.StatusOK, matched.StatusCode)
			require.Equal(t, encoding, matched.Header.Get("Content-Encoding"))

			for name, req := range map[string]http.Header{
				"plain tag for encoded representation":    headers("If-Match", etag),
				"encoded tag for identity representation": identityHeaders("If-Match", suffixed),
			} {
				mismatched, _ := get(large, req)
				require.Equal(t, http.StatusPreconditionFailed, mismatched.StatusCode, name)
				require.Empty(t, mismatched.Header.Get("ETag"), name)
			}

			res, body = get(small, headers())
			require.Equal(t, http.StatusOK, res.StatusCode)
			require.Empty(t, res.Header.Get("Content-Encoding"))
			smallTag := res.Header.Get("ETag")
			require.Regexp(t, `^"[0-9a-f]{64}"$`, smallTag)
			require.Len(t, arrowRows(t, body), 1)
			wildcard, _ = get(small, headers("If-None-Match", "*"))
			require.Equal(t, http.StatusNotModified, wildcard.StatusCode)
			require.Equal(t, smallTag, wildcard.Header.Get("ETag"))
		})
	}

	preferred, body := get(large, http.Header{"Accept-Encoding": {"gzip, zstd"}})
	require.Equal(t, "zstd", preferred.Header.Get("Content-Encoding"))
	require.True(t, strings.HasSuffix(preferred.Header.Get("ETag"), `-zstd"`))
	decoded, err := decoders["zstd"](body)
	require.NoError(t, err)
	require.Equal(t, plain, decoded)

	posted, body := do(http.MethodPost, server.URL, `{"type":"arrow","sql":"`+largeQuery+`"}`,
		http.Header{"Accept-Encoding": {"gzip"}, "Content-Type": {"application/json"}})
	require.Equal(t, http.StatusOK, posted.StatusCode)
	require.Equal(t, "gzip", posted.Header.Get("Content-Encoding"))
	require.Empty(t, posted.Header.Get("ETag"))
	decoded, err = decoders["gzip"](body)
	require.NoError(t, err)
	require.Equal(t, plain, decoded)

	transparent, body := get(large, nil)
	require.Equal(t, http.StatusOK, transparent.StatusCode)
	require.True(t, transparent.Uncompressed)
	require.Equal(t, plain, body)
}

func TestResponseEncodingMatchesGzhttp(t *testing.T) {
	db := setupTestDB(t)
	handler, err := New(db, WithCacheControl("public, max-age=60"))
	require.NoError(t, err)
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	client := &http.Client{Transport: &http.Transport{DisableCompression: true}}
	t.Cleanup(client.CloseIdleConnections)
	uri := server.URL + "/?type=arrow&sql=" + url.QueryEscape(largeQuery)
	large := make([]byte, gzhttp.DefaultMinSize)

	tests := []struct{ accept, want string }{
		{"", ""},
		{"identity", ""},
		{"*", ""},
		{"br", ""},
		{"deflate, br", ""},
		{"gzip", "gzip"},
		{"GZIP", "gzip"},
		{" gzip ", "gzip"},
		{"zstd", "zstd"},
		{"gzip, zstd", "zstd"},
		{"zstd, gzip", "zstd"},
		{"gzip, deflate, br", "gzip"},
		{"gzip;q=1.0, zstd;q=0.5", "gzip"},
		{"gzip;q=0.5, zstd;q=0.6", "zstd"},
		{"gzip;q=0.5, zstd;q=0.5", "zstd"},
		{"gzip;q=0, zstd", "zstd"},
		{"gzip, zstd;q=0", "gzip"},
		{"gzip;q=0", ""},
		{"zstd;q=0, gzip;q=0", ""},
		{"gzip;Q=0.8", "gzip"},
		{"gzip ; q=0.8 ; foo=bar", "gzip"},
		{"gzip;q=abc", ""},
		{"zstd;q=2", "zstd"},
		{"gzip;q=0.9, gzip;q=0", "gzip"},
		{"deflate;q=1, gzip;q=0.1", "gzip"},
		{"gzip,zstd;q=0.1", "gzip"},
	}
	for _, tt := range tests {
		t.Run(tt.accept, func(t *testing.T) {
			req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, uri, nil)
			require.NoError(t, err)
			if tt.accept != "" {
				req.Header.Set("Accept-Encoding", tt.accept)
			}
			res, err := client.Do(req)
			require.NoError(t, err)
			_, err = io.ReadAll(res.Body)
			require.NoError(t, res.Body.Close())
			require.NoError(t, err)
			require.Equal(t, http.StatusOK, res.StatusCode)
			require.Equal(t, tt.want, res.Header.Get("Content-Encoding"))
			require.Equal(t, tt.want, responseEncoding(req, large))
			if tt.want == "" {
				require.Regexp(t, `^"[0-9a-f]{64}"$`, res.Header.Get("ETag"))
			} else {
				require.True(t, strings.HasSuffix(res.Header.Get("ETag"), "-"+tt.want+`"`), res.Header.Get("ETag"))
			}
		})
	}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	require.Equal(t, "gzip", responseEncoding(req, large))
	require.Empty(t, responseEncoding(req, large[1:]))
}
