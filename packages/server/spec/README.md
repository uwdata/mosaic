# Mosaic server protocol

The wire contract shared by every Mosaic DuckDB server: `openapi.yaml` (HTTP),
`asyncapi.yaml` (WebSocket), and `schemas.yaml` (the request, response, and
error shapes both transports use). It renders at
[Server Protocol](https://idl.uw.edu/mosaic/api/duckdb/server-protocol) in the
docs and standalone with `pnpm run spec:preview`. `pnpm run spec:lint`
validates both documents.

`CONFORMANCE.md` records the decisions made where the servers disagreed and,
per server, what still differs from the spec.

## Conformance suite

`conformance/` starts one server configuration, replays the cases in
`conformance/cases/*.yaml` over HTTP POST, HTTP GET, and WebSocket, and checks
each response against the schema and the case's expectations. It also drives
the `@uwdata/mosaic-core` connectors against the server.

```sh
CONFORMANCE_SERVER=go pnpm -F @uwdata/mosaic-server-spec conformance
```

`CONFORMANCE_SERVER` is one of `node`, `python`, `rust`, `go`, `go-cache`,
`go-gatekeeper` (see `conformance/servers/index.ts`). The matching toolchain
must be installed; the server is built on first launch. Set `CONFORMANCE_URL`
to test a server you started yourself.

Runs are judged against `conformance/known-failures/<config>.yaml`: a run is
green when exactly the listed cases fail. Fixing a case therefore requires
removing it from that file, and `CONFORMANCE.md` is regenerated from those
files:

```sh
pnpm -F @uwdata/mosaic-server-spec conformance:docs
```

Server stdout/stderr and a JSON summary of each run land in
`conformance/.logs/`.
