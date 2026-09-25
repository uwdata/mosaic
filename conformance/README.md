# Mosaic server protocol and conformance suite

The wire contract shared by every Mosaic DuckDB server: `openapi.yaml` (HTTP),
`asyncapi.yaml` (WebSocket), and `schemas.yaml` (the request, response, and
error shapes both transports use). It renders at
[Server Protocol](https://idl.uw.edu/mosaic/api/duckdb/server-protocol) in the
docs and standalone with `pnpm run conformance:preview`. `pnpm run conformance:lint`
validates both documents.

`STATUS.md` records the decisions made where the servers disagreed and, per
server, what still differs from the spec.

## Conformance suite

The suite starts one server configuration, replays the cases in
`cases/*.yaml` over HTTP POST, HTTP GET, and WebSocket, and checks each
response against the schema and the case's expectations. It also drives the
`@uwdata/mosaic-core` connectors against the server.

```sh
CONFORMANCE_SERVER=go pnpm -F @uwdata/mosaic-conformance suite
```

`CONFORMANCE_SERVER` is one of `node`, `python`, `rust`, `go`, `go-cache`,
`go-gatekeeper` (see `implementations/index.ts`). The matching toolchain
must be installed; the server is built on first launch. Set `CONFORMANCE_URL`
to test a server you started yourself.

Runs are judged against `known-failures/<config>.yaml`, which lists per case
the violation ids the server produces today (for example `error.status.500`,
`arrow.eos`). A run is green when exactly those are observed; anything new is
a regression and anything that disappears must be removed from the file.
`STATUS.md` is regenerated from those files:

```sh
pnpm -F @uwdata/mosaic-conformance status
```

After fixing a server, `CONFORMANCE_SERVER=<config> pnpm -F @uwdata/mosaic-conformance baseline`
refreshes that file from the last run. `pnpm -F @uwdata/mosaic-conformance test`
runs the harness's own unit tests without a server; the root `pnpm test`
includes them.

Server stdout/stderr and a JSON summary of each run land in `.logs/`.
