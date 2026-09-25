# Mosaic server protocol and conformance suite

The wire contract shared by every Mosaic DuckDB server: `openapi.yaml` (HTTP),
`asyncapi.yaml` (WebSocket), and `schemas.yaml` (the request, response, and
error shapes both transports use). It renders at
[Server Protocol](https://idl.uw.edu/mosaic/api/duckdb/server-protocol) in the
docs and standalone with `pnpm run conformance:preview`. `pnpm run conformance:lint`
validates both documents.

`STATUS.md` records the decisions made where the implementations disagreed
and, per target, what still differs from the spec.

## Conformance suite

The suite points at one *target*, replays the cases in `cases/*.yaml`, and
checks each response against the schema and the case's expectations:

```sh
CONFORMANCE_TARGET=go pnpm -F @uwdata/mosaic-conformance suite
```

`CONFORMANCE_TARGET` is one of the targets in `implementations/index.ts`
(`node`, `python`, `rust`, `go`, `go-cache`, `go-gatekeeper`). A server
target is built on first launch and needs its toolchain installed; set
`CONFORMANCE_URL` to test a server you started yourself.

### Layers

Cases are checked at two layers, and a target declares which transports it
runs each on:

- **Wire** (`post`, `get`, `ws`): the encoded protocol. Framing, media types,
  headers, status codes, the error envelope, and, over WebSocket, positional
  ordering and connection lifetime.
- **Command** (`rest`, `socket`, `inproc`): what the coordinator sees through
  a `Connector`. Results must decode to the expected table whatever the IPC
  framing, `exec` resolves `undefined`, `preagg` resolves a
  `PreaggResponse`, and rejections carry `code`, `reason`, `field`, and a
  `reference` for `table_not_found`. Concurrent calls are checked for
  association (each gets its own result), not order.

A case belongs to the wire layer alone when anything in it is about
encoding: raw bodies, headers, statuses, encoded size, GET semantics. Every
other case runs at both. `cases/*.yaml` may pin this with `layers:`, and
`applicability.test.ts` lists the whole corpus so a change in classification
is a visible diff. Server targets run the corpus over the real
`@uwdata/mosaic-core` connectors as `rest` and `socket`; the reference server
(`go`) runs all of it, the others run the cases tagged `smoke: true`.

### Baselines

Runs are judged against `known-failures/<target>.yaml`, which lists per case
the violation ids the target produces today (for example `error.status.500`,
`arrow.eos`, `error.code.missing`). A run is green when exactly those are
observed; anything new is a regression and anything that disappears must be
removed from the file. `STATUS.md` is regenerated from those files:

```sh
pnpm -F @uwdata/mosaic-conformance status
```

After fixing an implementation, `CONFORMANCE_TARGET=<target> pnpm -F @uwdata/mosaic-conformance baseline`
refreshes that file from the last run. `pnpm -F @uwdata/mosaic-conformance test`
runs the harness's own unit tests without a target; the root `pnpm test`
includes them.

Server output and a JSON summary of each run land in `.logs/`.
