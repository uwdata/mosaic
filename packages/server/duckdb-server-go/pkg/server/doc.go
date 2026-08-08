// Package server provides an HTTP and WebSocket handler for Mosaic commands.
//
// Authentication belongs in standard HTTP middleware wrapped around the
// handler returned by New. WithAuthorizer adds command-aware authorization:
// its Authorizer inspects the authenticated request once, then its returned
// CommandAuthorizer is called for every decoded command before query policy
// validation, cache access, or database execution.
//
// AuthorizeRequest runs before a POST body is decoded or a WebSocket is
// upgraded. It should normally inspect the request line, headers, and context.
// Code that reads the request body, whether outer middleware verifying an HMAC
// or an Authorizer, must restore the body before passing the request onward.
//
// Authorizers and their returned functions must be safe for concurrent use.
// A WebSocket session rechecks its CommandAuthorizer for every message, so an
// implementation may consult current expiry or revocation state instead of
// caching an allow decision.
//
// CORS preflight is handled inside the returned handler. Unless
// CORSOptions.AllowAllOrigins is set, actual HTTP commands are checked with
// net/http CrossOriginProtection before authorization or execution.
// Authentication middleware wrapped around the handler must decide whether to
// pass OPTIONS requests through. Because GET requests can execute commands,
// cookie-backed deployments must keep this protection enabled or apply an
// equivalent outer CSRF policy.
//
// Command authorization controls submitted SQL only. It does not isolate the
// shared process, filesystem, network, extensions, catalogs, or credentials.
package server
