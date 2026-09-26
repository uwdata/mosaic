# Mosaic server protocol and conformance suite

The wire contract shared by every Mosaic DuckDB engine, `openapi.yaml`: the
HTTP transport, the request, response, and error shapes under
`components/schemas`, and the Jupyter comm framing the Python widget uses
(`CommRequest`, `CommReply`). It renders at
[Server Protocol](https://idl.uw.edu/mosaic/api/duckdb/server-protocol) in the
docs (`pnpm docs:dev` while editing). `pnpm run conformance:lint` validates
it.

`STATUS.md` records the decisions made where the implementations disagreed
and, per target, what still differs from the spec.
