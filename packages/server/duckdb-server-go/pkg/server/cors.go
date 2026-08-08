package server

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	rscors "github.com/rs/cors"
)

var corsAllowedMethods = []string{http.MethodGet, http.MethodPost}

func newCORSHandler(options CORSOptions, protection *http.CrossOriginProtection, next http.Handler) http.Handler {
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
		preflight := r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != ""
		if r.Method == http.MethodOptions && !preflight {
			w.Header().Add("Vary", "Origin, Sec-Fetch-Site, Access-Control-Request-Method, Access-Control-Request-Headers")
			w.WriteHeader(http.StatusOK)
			return
		}
		if !preflight && protection != nil {
			w.Header().Add("Vary", "Sec-Fetch-Site")
			if !crossOriginAllowed(protection, r) {
				w.Header().Add("Vary", "Origin")
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}
		}
		inner.ServeHTTP(w, r)
	})
}

func crossOriginAllowed(protection *http.CrossOriginProtection, r *http.Request) bool {
	request := new(http.Request)
	*request = *r
	// CrossOriginProtection exempts safe methods, but Mosaic's GET API can
	// execute commands.
	request.Method = http.MethodPost
	return protection.Check(request) == nil
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
