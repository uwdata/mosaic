package server

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	rscors "github.com/rs/cors"
)

var corsAllowedMethods = []string{http.MethodGet, http.MethodPost}

func newCORSHandler(options CORSOptions, next http.Handler) http.Handler {
	allowedHeaders := options.AllowedHeaders
	switch {
	case options.AllowAllHeaders:
		allowedHeaders = []string{"*"}
	case len(allowedHeaders) == 0:
		// These are the only non-simple headers required by the JSON API.
		allowedHeaders = []string{"Accept", "Content-Type"}
	}

	corsOptions := rscors.Options{
		AllowedMethods:       corsAllowedMethods,
		AllowedHeaders:       allowedHeaders,
		AllowCredentials:     options.AllowCredentials,
		MaxAge:               int(options.MaxAge / time.Second),
		OptionsSuccessStatus: http.StatusOK,
	}
	if options.AllowAllOrigins {
		corsOptions.AllowedOrigins = []string{"*"}
	} else {
		allowedOrigins := make(map[string]struct{}, len(options.AllowedOrigins))
		for _, origin := range options.AllowedOrigins {
			allowedOrigins[origin] = struct{}{}
		}
		// rs/cors expands '*' in origin entries, but this API promises exact
		// origins unless AllowAllOrigins is set explicitly.
		corsOptions.AllowOriginFunc = func(origin string) bool {
			_, ok := allowedOrigins[strings.ToLower(origin)]
			return ok
		}
	}

	inner := rscors.New(corsOptions).Handler(next)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") == "" {
			w.Header().Add("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers")
			w.WriteHeader(http.StatusOK)
			return
		}
		inner.ServeHTTP(w, r)
	})
}

func isHTTPOrigin(origin string) bool {
	u, err := url.Parse(origin)
	return err == nil &&
		(u.Scheme == "http" || u.Scheme == "https") &&
		u.Host != "" &&
		u.User == nil &&
		u.Path == "" &&
		u.RawQuery == "" &&
		u.Fragment == "" &&
		!u.ForceQuery
}
