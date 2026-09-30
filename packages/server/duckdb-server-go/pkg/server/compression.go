package server

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/klauspost/compress/gzhttp"
)

// gzhttp's encoding selection is unexported, so this mirrors it for the
// default options; TestResponseEncodingMatchesGzhttp pins the two together.
func responseEncoding(r *http.Request, response commandResponse) string {
	if len(response.data) < gzhttp.DefaultMinSize || !gzhttp.DefaultContentTypeFilter(response.contentType) {
		return ""
	}
	accept := r.Header.Get("Accept-Encoding")
	gzipQ := acceptEncodingQValue(accept, "gzip")
	zstdQ := acceptEncodingQValue(accept, "zstd")
	switch {
	case zstdQ > 0 && zstdQ >= gzipQ:
		return "zstd"
	case gzipQ > 0:
		return "gzip"
	default:
		return ""
	}
}

func acceptEncodingQValue(header, coding string) float64 {
	for part := range strings.SplitSeq(header, ",") {
		name, params, _ := strings.Cut(part, ";")
		if strings.ToLower(strings.TrimSpace(name)) != coding {
			continue
		}
		q := 1.0
		for param := range strings.SplitSeq(params, ";") {
			param = strings.TrimSpace(param)
			if len(param) >= 2 && strings.EqualFold(param[:2], "q=") {
				q, _ = strconv.ParseFloat(param[2:], 64)
			}
		}
		return min(max(q, 0), 1)
	}
	return 0
}
