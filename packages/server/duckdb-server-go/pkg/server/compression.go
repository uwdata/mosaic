package server

import (
	"net/http"
	"strings"

	"github.com/klauspost/compress/gzhttp"
)

// gzhttp inserts the negotiated encoding before the closing quote of a
// compressed response's ETag, and clients revalidate with that suffixed tag.
var etagEncodingSuffixes = []string{`-gzip"`, `-zstd"`}

var compressResponses = func() func(http.Handler) http.HandlerFunc {
	wrapper, err := gzhttp.NewWrapper(gzhttp.SuffixETag("-gzip"))
	if err != nil {
		panic(err)
	}
	return wrapper
}()

func stripETagEncodingSuffix(tag string) string {
	for _, suffix := range etagEncodingSuffixes {
		if strings.HasSuffix(tag, suffix) {
			return tag[:len(tag)-len(suffix)] + `"`
		}
	}
	return tag
}

func unwrapResponseWriter(w http.ResponseWriter) http.ResponseWriter {
	for {
		u, ok := w.(interface{ Unwrap() http.ResponseWriter })
		if !ok {
			return w
		}
		w = u.Unwrap()
	}
}
