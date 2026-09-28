package server

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/zstd"
	"github.com/stretchr/testify/require"
)

func TestHTTPResponseCompression(t *testing.T) {
	db := setupTestDB(t)
	handler, err := New(db, WithCacheControl("public, max-age=60"))
	require.NoError(t, err)
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	large := server.URL + "/?type=arrow&sql=" + url.QueryEscape("SELECT range AS value FROM range(2000)")
	small := server.URL + "/?type=arrow&sql=SELECT+1+AS+value"

	do := func(method, uri, body string, headers http.Header) (*http.Response, []byte) {
		t.Helper()
		req, err := http.NewRequestWithContext(t.Context(), method, uri, strings.NewReader(body))
		require.NoError(t, err)
		for name, values := range headers {
			req.Header[name] = values
		}
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

	identity, plain := get(large, http.Header{"Accept-Encoding": {"identity"}})
	require.Equal(t, http.StatusOK, identity.StatusCode)
	require.Empty(t, identity.Header.Get("Content-Encoding"))
	require.Greater(t, len(plain), gzhttp.DefaultMinSize)
	require.Len(t, arrowRows(t, plain), 2000)
	etag := identity.Header.Get("ETag")
	require.Regexp(t, `^"[0-9a-f]{64}"$`, etag)
	require.Contains(t, strings.Join(identity.Header.Values("Vary"), ","), "Accept-Encoding")

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
			accept := http.Header{"Accept-Encoding": {encoding}}
			res, body := get(large, accept)
			require.Equal(t, http.StatusOK, res.StatusCode)
			require.Equal(t, encoding, res.Header.Get("Content-Encoding"))
			require.Equal(t, commandResponses[CommandArrow].contentType, res.Header.Get("Content-Type"))
			require.Contains(t, strings.Join(res.Header.Values("Vary"), ","), "Accept-Encoding")
			require.Less(t, len(body), len(plain))
			decoded, err := decode(body)
			require.NoError(t, err)
			require.Equal(t, plain, decoded)

			suffixed := res.Header.Get("ETag")
			require.Equal(t, strings.TrimSuffix(etag, `"`)+"-"+encoding+`"`, suffixed)

			revalidated, body := get(large, http.Header{"Accept-Encoding": {encoding}, "If-None-Match": {suffixed}})
			require.Equal(t, http.StatusNotModified, revalidated.StatusCode)
			require.Empty(t, body)
			require.Equal(t, suffixed, revalidated.Header.Get("ETag"))
			require.Empty(t, revalidated.Header.Get("Content-Encoding"))
			require.Equal(t, res.Header.Values("Cache-Control"), revalidated.Header.Values("Cache-Control"))
			require.Equal(t, res.Header.Values("Vary"), revalidated.Header.Values("Vary"))

			plainTag, body := get(large, http.Header{"Accept-Encoding": {encoding}, "If-None-Match": {etag}})
			require.Equal(t, http.StatusNotModified, plainTag.StatusCode)
			require.Empty(t, body)
			require.Equal(t, etag, plainTag.Header.Get("ETag"))

			matched, _ := get(large, http.Header{"Accept-Encoding": {encoding}, "If-Match": {suffixed}})
			require.Equal(t, http.StatusOK, matched.StatusCode)
			require.Equal(t, encoding, matched.Header.Get("Content-Encoding"))

			mismatched, _ := get(large, http.Header{"Accept-Encoding": {encoding}, "If-Match": {`"other-` + encoding + `"`}})
			require.Equal(t, http.StatusPreconditionFailed, mismatched.StatusCode)
			require.Empty(t, mismatched.Header.Get("ETag"))

			res, body = get(small, accept)
			require.Equal(t, http.StatusOK, res.StatusCode)
			require.Empty(t, res.Header.Get("Content-Encoding"))
			require.Regexp(t, `^"[0-9a-f]{64}"$`, res.Header.Get("ETag"))
			require.Len(t, arrowRows(t, body), 1)
		})
	}

	preferred, body := get(large, http.Header{"Accept-Encoding": {"gzip, zstd"}})
	require.Equal(t, "zstd", preferred.Header.Get("Content-Encoding"))
	decoded, err := decoders["zstd"](body)
	require.NoError(t, err)
	require.Equal(t, plain, decoded)

	posted, body := do(http.MethodPost, server.URL, `{"type":"arrow","sql":"SELECT range AS value FROM range(2000)"}`,
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
