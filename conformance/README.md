# Mosaic server protocol and conformance suite

The wire contract shared by every Mosaic DuckDB server: `openapi.yaml` (HTTP),
`asyncapi.yaml` (WebSocket), and `schemas.yaml` (the request, response, and
error shapes both transports use). It renders at
[Server Protocol](https://idl.uw.edu/mosaic/api/duckdb/server-protocol) in the
docs (`pnpm docs:dev` while editing). `pnpm run conformance:lint` validates
both documents.

`STATUS.md` records the decisions made where the implementations disagreed
and, per target, what still differs from the spec.
