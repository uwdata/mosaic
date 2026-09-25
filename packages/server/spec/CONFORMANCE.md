# Server conformance

Gap analysis of each server implementation against `openapi.yaml`,
`asyncapi.yaml`, and `schemas.yaml`. The spec describes the *desired* state;
none of the servers fully conform yet. The per-server tables at the end are
generated from `conformance/known-failures/*.yaml`, which the conformance
suite in `conformance/` also reads, so a gap and its test stay in step.

Client baseline: `packages/mosaic/core/src/connectors` on main after #1172
(drop `json`), #1213 (drop `persist` and result caches), #1209 (socket
pipelining), and #1228 (`type` required). The `preagg` command is implemented
by [#1224](https://github.com/uwdata/mosaic/pull/1224), stacked on this PR.

## Decisions made while drafting

Where the servers disagreed, the spec picks one behaviour. Each is revisable.

| # | Topic | Decision | Alternatives observed |
|---|-------|----------|-----------------------|
| D1 | `type` required | Required; missing → `400 bad_request` with the canonical message `missing required 'type' parameter`, as settled by #1228 across the client types and all four servers. | An earlier draft defaulted to `arrow` when Node did; #1228 removed that default. |
| D2 | GET parameters | Flat `?type=&sql=`. | Python reads `?query=<json>`; Rust README documents `?query=` but its code reads flat params; Node GET always 400s. |
| D3 | GET command set | `arrow` only; `exec`/`preagg` over GET are `400 bad_request`. | Rust and Go run `exec` over GET. |
| D3a | GET read-only SQL | GET `sql` must satisfy `ReadOnlySql` (SELECT/VALUES/set-op/CTE root), verified before execution even with no policy active. Restricting `type` alone is insufficient: `DELETE FROM t RETURNING *` is one statement that returns rows. `POST` `arrow` is deliberately not restricted; revisit if `exec` is ever removed. | No server checks statement kind over GET. Go can reuse its `json_serialize_sql` walker; the others need a parser step. |
| D4 | Error body | JSON `Error` envelope on every transport and every status, including 405/412/413/415. | Go emits `{code,error}` over WebSocket only; HTTP is plain text everywhere; Rust/Node send empty bodies for some errors. |
| D5 | Codes for transport-level rejects | 405, 412, 413, 415 carry `code: bad_request`; these statuses are listed as exceptions in the `ErrorCode` table and take precedence over the canonical 400. | Could add dedicated codes; #1218 defines none. |
| D5a | Code vocabulary | Closed: `ErrorCode` is an exhaustive enum and adding a code requires a schema change. Deployment authorizers map onto the standard codes (`unauthenticated`/`forbidden`/`bad_request`/`internal_error`). | An open `x_`-prefixed extension namespace was considered; rejected because the client cannot act on unknown codes and a closed set keeps schema validation meaningful for the conformance runner. |
| D6 | Unknown vs. disabled command | Unknown `type` string is `bad_request`; a known command disabled by deployment/policy (`exec` under validation, `preagg` off) is `unsupported_command`. | Go returns `bad_request` for `ErrExecWithValidation`. |
| D7 | DuckDB execution errors | `internal_error` (500) unless classified: `bad_request` for parse errors and unsupported statement kinds, `forbidden` for policy, `table_not_found` for managed tables. Parse errors MUST be classified even when no policy is active. | Go classifies parse errors only when `json_serialize_sql` validation runs; otherwise a syntax error is a 500. Others 500 everything. Whether a runtime `Catalog Error` on a user table should be 400 is open. |
| D8 | Arrow encoding | IPC **stream** format, `Content-Type: application/vnd.apache.arrow.stream`, never an empty body. | Rust sends IPC *file* format under the stream media type; Python labels the stream `application/octet-stream`; Node sends 0 bytes for 0 rows. |
| D9 | Application-owned fields | Servers MUST accept unknown properties and pass them to authorization; they MUST NOT override `type`/`sql`. Matches the Go `WithAuthorizer` design (#1215). | Go's `encoding/json` matches keys case-insensitively with last-wins, so `TYPE` can shadow `type`; flagged below. |
| D10 | Request `Content-Type` | Client sends `application/json`; servers MAY 415 anything else. | Rust 415s; others ignore the header. |
| D11 | WebSocket order | Exactly one response per command, in request order, including commands that fail before execution. Required by #1209 pipelining. | All servers serialize per connection today; Python sends no reply for a missing `sql`/`type`, which desynchronizes a pipelining client. |
| D12 | WebSocket malformed JSON | `Error` text frame, connection stays open. | Go closes with 1007. |
| D13 | Size floor | SHOULD accept ≥ 1 MiB. | Python WS 16 KiB; Go WS 32 KiB default; Rust POST 2 MiB. |
| D14 | Caching | Adopt the Go `--cache-control`/`--vary` design (#1216): GET `arrow` only; strong `ETag` over the body; weak `If-None-Match` → 304; strong `If-Match` → 412; `no-store` on everything else once enabled; identity headers in `Vary`. No server-side result cache. | Only Go implements any of it. |
| D15 | `name` field | Dropped from the protocol. | Rust and Go still parse it and never use it. |
| D16 | Multi-statement | `exec` MAY contain several statements; `arrow`/`preagg` exactly one, trailing `;` allowed. | Go and Python run all statements for `arrow` and return the last; Rust errors; Node rejects a trailing `;`. |
| D17 | `preagg_drop`, `refresh` | Out of scope until a client sends them. | Defined in #1218. |

## Common gaps (all four servers)

- No JSON error envelope over HTTP (D4).
- No `preagg` command; must return `400 unsupported_command`, not an unknown-type error.
- No `deadline_exceeded`, `resource_exhausted`, or `table_not_found` paths; only Go has `unauthenticated`.
- `exec` runs over GET where GET works at all (D3), and no server checks that GET SQL is read-only (D3a).
- `Access-Control-Request-Method: *` is emitted as a *response* header by Python and Node (it is a request header). No server sets `Access-Control-Expose-Headers`, so browsers cannot read `ETag` cross-origin.
- No server sends `Allow` on 405.

## Conformance suite

`conformance/` is a vitest project that starts one server configuration on a
free port, replays declarative cases from `conformance/cases/*.yaml` over
HTTP POST, HTTP GET, and WebSocket, and checks every response against
`schemas.yaml` with Ajv plus the case's own expectations. Arrow bodies are
decoded with Flechette and compared as rows. A second file drives the real
`@uwdata/mosaic-core` connectors end to end.

```sh
CONFORMANCE_SERVER=go pnpm -F @uwdata/mosaic-server-spec conformance
```

Configurations are defined in `conformance/servers/index.ts`: `node`,
`python`, `rust`, `go`, `go-cache`, `go-gatekeeper`. Each declares
capabilities (`exec`, `preagg`, `caching`, `files`); cases gate on them with
`requires`/`unless`. `CONFORMANCE_URL` points the suite at an already
running server instead of spawning one. Server output is written to
`conformance/.logs/<config>.log`.

The suite is a ratchet. `conformance/known-failures/<config>.yaml` lists the
cases that fail today, grouped by area with the observed behaviour and the
fix. A run is green when the failing set equals that list. A case that
regresses fails the run; a case that starts passing also fails the run until
it is removed from the list, so the lists only shrink. Full conformance is
reached when they are empty. `go-cache` and `go-gatekeeper` inherit the plain
`go` list and add or exempt (`passes`) entries.

To add a case, append it to a file in `conformance/cases/` with the decision
ids it exercises, run every configuration, add the new failures to the
matching `known-failures` file, then regenerate the tables below:

```sh
pnpm -F @uwdata/mosaic-server-spec conformance:docs
```

CI runs all six configurations on every pull request that touches a server
or the spec (`.github/workflows/server-protocol.yml`) and fails if the tables
below are stale.

Not observable from outside, so still tracked by hand (`cases: []`):
authorizer mappings (`unauthenticated`/`forbidden`), tenant `Vary` headers,
timeouts, and internal structure such as shared connections.


<!-- conformance:begin -->
<!-- Generated from conformance/known-failures/*.yaml by conformance/generate-conformance-md.ts. Edit the YAML, then run `pnpm -F @uwdata/mosaic-server-spec conformance:docs`. -->

## Go `duckdb-server-go`

Configuration: `duckdb-server-go` with default flags.

Closest to the target and the intended first `preagg` implementation (#1234). Already conforming: WebSocket error frames carry `code` (`pkg/server/errors.go`); Arrow IPC stream with the end-of-stream marker; GET caching with a strong `ETag`, weak `If-None-Match` → 304, strong `If-Match` → 412, `no-store` elsewhere (`pkg/server/cache.go`); application payload passthrough via `WithAuthorizer` (`pkg/server/authorization.go`); `Vary` auto-includes schema-match headers.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| HTTP errors are plain text | `http.Error` writes `text/plain` even though `classifyError` already yields a code (`pkg/server/server.go`). | JSON `Error` envelope (D4). | Reuse `classifyError`; write `{error, code}` with `application/json`. | 12 |
| Parse errors are 500 without a policy | `json_serialize_sql` runs only under validation, so a syntax error is an unclassified `internal_error`. | `bad_request` regardless of policy (D7). | Run statement extraction unconditionally, or map DuckDB parser errors. | 4 |
| `preagg` is unknown | `invalid 'type' parameter: preagg` as `bad_request`. | `unsupported_command` (D6). Go is the intended first `preagg` implementation (#1234). | Recognise the command and answer `unsupported_command` until implemented. | 2 |
| Exec and side effects over GET | GET runs `exec` and does not check the statement kind, so `CREATE TABLE` and `DELETE ... RETURNING` execute (`server.go`). | `arrow` only (D3); read-only root required (D3a). | Reject `exec` in the GET branch; run the `json_serialize_sql` walker for GET unconditionally. | 3 |
| Multi-statement `arrow` | duckdb-go `prepareStmts` runs every statement and returns the last result. | `bad_request` (D16). | Count statements before execution. | 2 |
| JSON keys match case-insensitively | `encoding/json` lets `TYPE: exec` override `type: arrow`; the request ran as `exec` and returned an empty body. | Protocol fields decoded exactly; application fields must not shadow them (D9). | Decode protocol fields with a strict decoder or reject case-variant duplicates. | 2 |
| 405 without `Allow` | `Method not allowed` plain text, no `Allow` header. | Envelope plus `Allow: GET, POST, OPTIONS` (D5). | Set the header in the fallback branch. | 2 |
| WebSocket malformed JSON closes the socket | `wsjson.Read` failure closes with 1007 (`server.go`). | `Error` frame, connection stays open (D12). | Read the raw frame and unmarshal manually. | 2 |
| WebSocket read limit | 32 KiB library default; larger frames close with 1009. | Accept at least 1 MiB (D13). | Set a default via `WithMaxMessageBytes` and expose a CLI flag. | 1 |
| 401 schema-match is plain text | `no allowed schemas found in request headers` via `http.Error`. | Envelope with `unauthenticated`. | Same mapper as the other HTTP errors. Needs an authorizer, which the CLI does not expose, so the suite cannot observe it. | not observable |
| WebSocket close code and pings | Always `Close(1011)` on loop exit; pings are answered only inside `conn.Read`. | 1000 on a clean client close; SHOULD answer pings during execution. | Distinguish `CloseError`; add a reader goroutine or ping ticker. | not observable |
| Upgrade detection | Whole-value `EqualFold` on `Connection` (`server.go`). | Token-based matching. | Scan `Connection` tokens. | not observable |
| Timeouts | None. | `deadline_exceeded`; also needed by #1234. | Per-command deadline. | not observable |

<details><summary>Case ids</summary>

- **HTTP errors are plain text**: `post/missing-type`, `post/missing-sql`, `post/empty-sql`, `post/unknown-type`, `post/type-not-a-string`, `post/malformed-json-body`, `post/sql-unknown-table`, `post/sql-runtime-error`, `post/exec-error`, `get/get-missing-type`, `get/get-json-wrapped-query-rejected`, `get/get-preagg-rejected`
- **Parse errors are 500 without a policy**: `post/sql-parse-error`, `ws/sql-parse-error`, `ws/ws-pipeline-order`, `connector/rest-error`
- **`preagg` is unknown**: `post/preagg-unsupported`, `ws/preagg-unsupported`
- **Exec and side effects over GET**: `get/get-exec-rejected`, `get/get-ddl-rejected`, `get/get-delete-returning-rejected`
- **Multi-statement `arrow`**: `post/arrow-multi-statement`, `ws/arrow-multi-statement`
- **JSON keys match case-insensitively**: `post/protocol-fields-not-shadowed`, `ws/protocol-fields-not-shadowed`
- **405 without `Allow`**: `post/method-put`, `post/method-head`
- **WebSocket malformed JSON closes the socket**: `ws/ws-malformed-json-stays-open`, `ws/type-not-a-string`
- **WebSocket read limit**: `ws/large-request-1mib`

</details>

### With `--cache-control`

Configuration: `duckdb-server-go --cache-control='public, max-age=60'`.
Everything in the Go `duckdb-server-go` table applies here too (30 inherited cases). Only the differences are listed.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| 412 is plain text | `Precondition Failed` via `http.Error` (`pkg/server/cache.go`). | `bad_request` envelope, no `ETag` (D14, D5). | Same mapper as the other HTTP errors. | 1 |
| Errors under caching are still plain text | The GET parse-error path returns 500 plain text; `Cache-Control: no-store` is present. | 400 envelope with `no-store` (D7, D14). | Covered by the envelope and parse-error fixes in go.yaml. | 1 |
| `ETag` is not exposed to browsers | No `Access-Control-Expose-Headers` on preflight (`security.go`). | Expose `ETag` when caching is enabled (D14). | Add to the `WithCORS` defaults. | 1 |
| `Cache-Control: private` with an authorizer | The operator value is used verbatim even when an authorizer varies the response by identity. | Identity headers in `Vary`, or `private`/`no-store` (D14). | Document; optionally append identity headers to `Vary` from `AuthorizeRequest`. | not observable |

<details><summary>Case ids</summary>

- **412 is plain text**: `get/cache-if-match`
- **Errors under caching are still plain text**: `get/cache-error-no-store`
- **`ETag` is not exposed to browsers**: `post/cache-preflight-no-store`

</details>

### With `--gatekeeper`

Configuration: `duckdb-server-go --gatekeeper='{"version":1,"options":{}}'`; validation disables `exec` and local file access.
Everything in the Go `duckdb-server-go` table applies here too (23 inherited cases; `connector/rest-error`, `ws/sql-parse-error`, `ws/ws-pipeline-order` pass under this configuration). Only the differences are listed.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| Disabled `exec` is `bad_request` | `ErrExecWithValidation` maps to `bad_request` (`pkg/server/errors.go`); an application field spelled `TYPE: exec` also trips it, see D9 in go.yaml. | `unsupported_command` (D6). | Remap in `classifyError`. | 2 |
| Gatekeeper rejections are `forbidden` or `bad_request` regardless of cause | A multi-statement `arrow` is `forbidden` (403) and an unknown table is `bad_request` (400 `Bad Request`) because Gatekeeper validation fails before DuckDB classifies the statement. | Multi-statement is `bad_request` (D16); an unknown user table is `internal_error` unless classified as a managed table (D7, still open in CONFORMANCE.md). | Split validator errors from policy denials when mapping to codes. | 5 |
| Parse error body is `Bad Request` | The status is right but the body is the plain `http.StatusText`. | Envelope with the DuckDB message (D4, D7). | Covered by the envelope fix in go.yaml. | 1 |
| Local file reads are denied | Default Gatekeeper policy rejects `read_parquet` on a local path with 403 `Forbidden`. | Deployment choice; the suite marks this configuration as lacking the `files` capability. Listed so the plain-text body is not lost. | Envelope fix in go.yaml; optionally allow the shared data directory in the test policy. | not observable |

<details><summary>Case ids</summary>

- **Disabled `exec` is `bad_request`**: `post/exec-unsupported`, `ws/exec-unsupported`
- **Gatekeeper rejections are `forbidden` or `bad_request` regardless of cause**: `post/arrow-multi-statement`, `ws/arrow-multi-statement`, `post/sql-unknown-table`, `ws/sql-unknown-table`, `ws/ws-sql-error-stays-open`
- **Parse error body is `Bad Request`**: `post/sql-parse-error`

</details>

## Rust `duckdb-server`

Configuration: `duckdb-server` crate (`packages/server/duckdb-server-rust`).

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| Arrow IPC file format | `FileWriter` output (`ARROW1` magic plus footer) under the stream media type (`db.rs`, `interfaces.rs`). | IPC stream format (D8). | Use `StreamWriter`; update the `test.rs` assertion. Every Arrow success case is masked by this until it lands. | 34 |
| HTTP errors are plain text or empty | Rejections are serde/axum text (`interfaces.rs`); DuckDB errors are `Something went wrong: …`; 405 and 415 have plain or empty bodies. | JSON `Error` envelope on every status (D4, D5). | Custom rejection handlers and a shared error mapper. | 12 |
| WebSocket errors lack `code` | `{"error"}` only (`websocket.rs`); the message also differs from HTTP. | Envelope with `code`, identical over both transports (D4). | Shared mapper. | 13 |
| Unknown `type` is 422 | serde enum rejection surfaces as axum's 422 `Failed to deserialize the JSON body`. | 400 `bad_request` (D6). | Decode `type` as a string and match manually. | 1 |
| `preagg` is unknown | Same 422 path as any unknown variant. | `unsupported_command` (D6). | Add the variant and answer `unsupported_command` until implemented. | 1 |
| Parse errors and empty `sql` are 500 | Every `duckdb::Error` is `Something went wrong` with 500; an empty string yields `Error code 1: Unknown error code`. | `bad_request` for parse errors and empty SQL (D1, D7). | Validate `sql`; map `duckdb::Error` variants to codes. | 3 |
| Exec and side effects over GET | `handle_get` runs any `type` and does not check the statement kind. | `arrow` only (D3); read-only root required (D3a). | Reject `exec` in `handle_get`; check the statement type before execution. | 3 |
| Multi-statement `arrow` | Runs and returns a result rather than rejecting. | `bad_request` (D16). | Count statements before execution. | 2 |
| HEAD runs the query | axum's GET route also serves HEAD, so `HEAD /?type=arrow&sql=…` executes and returns 200. | 405 with `Allow` (D5). | Add an explicit fallback for other methods. | 1 |
| WebSocket binary frames are ignored | `Message::Binary` is dropped with no reply (`websocket.rs`). | SHOULD accept; MUST reply (D11). | Treat as text or answer with `bad_request`. | 1 |
| Malformed upgrade falls through to GET | A bad upgrade request reaches the GET handler (`app.rs`). | 400 envelope. | Return the upgrade rejection. | not observable |
| README GET example | `?query={…}` is documented but the code reads flat parameters. | Flat parameters (D2). | Fix the README. | not observable |
| CORS and caching headers | No `Access-Control-Expose-Headers`; no cache headers. | Expose `ETag`; caching optional (D14). | Edit `CorsLayer`; add cache headers if wanted. | not observable |
| Timeouts | None; DuckDB calls block tokio workers (`db.rs`). | `deadline_exceeded`. | `spawn_blocking` plus `duckdb_interrupt`. | not observable |

<details><summary>Case ids</summary>

- **Arrow IPC file format**: `connector/rest-arrow`, `connector/rest-exec`, `connector/socket-arrow`, `connector/socket-error-then-ok`, `connector/socket-pipeline`, `get/get-arrow`, `get/get-plus-in-sql`, `get/get-cte-allowed`, `get/get-set-operation-allowed`, `post/arrow-stream-format`, `post/arrow-empty-result`, `post/arrow-scalar-types`, `post/arrow-many-rows`, `post/arrow-from-parquet`, `post/arrow-trailing-semicolon`, `post/application-fields-pass-through`, `post/protocol-fields-not-shadowed`, `post/content-type-with-charset`, `post/arrow-cors-origin`, `post/large-request-1mib`, `post/exec-acknowledged`, `post/exec-multi-statement`, `ws/arrow-stream-format`, `ws/arrow-empty-result`, `ws/arrow-scalar-types`, `ws/arrow-many-rows`, `ws/arrow-trailing-semicolon`, `ws/application-fields-pass-through`, `ws/protocol-fields-not-shadowed`, `ws/large-request-1mib`, `ws/exec-acknowledged`, `ws/exec-multi-statement`, `ws/ws-pipeline-order`, `ws/ws-pipeline-slow-first`
- **HTTP errors are plain text or empty**: `post/missing-type`, `post/missing-sql`, `post/type-not-a-string`, `post/malformed-json-body`, `post/sql-unknown-table`, `post/sql-runtime-error`, `post/exec-error`, `post/content-type-not-json`, `post/method-put`, `get/get-missing-type`, `get/get-json-wrapped-query-rejected`, `get/get-preagg-rejected`
- **WebSocket errors lack `code`**: `ws/missing-type`, `ws/missing-sql`, `ws/empty-sql`, `ws/unknown-type`, `ws/type-not-a-string`, `ws/preagg-unsupported`, `ws/sql-parse-error`, `ws/sql-unknown-table`, `ws/sql-runtime-error`, `ws/exec-error`, `ws/ws-malformed-json-stays-open`, `ws/ws-missing-sql-stays-open`, `ws/ws-sql-error-stays-open`
- **Unknown `type` is 422**: `post/unknown-type`
- **`preagg` is unknown**: `post/preagg-unsupported`
- **Parse errors and empty `sql` are 500**: `post/sql-parse-error`, `post/empty-sql`, `connector/rest-error`
- **Exec and side effects over GET**: `get/get-exec-rejected`, `get/get-ddl-rejected`, `get/get-delete-returning-rejected`
- **Multi-statement `arrow`**: `post/arrow-multi-statement`, `ws/arrow-multi-statement`
- **HEAD runs the query**: `post/method-head`
- **WebSocket binary frames are ignored**: `ws/ws-binary-frame`

</details>

## Python `duckdb-server`

Configuration: `duckdb-server` (`packages/server/duckdb-server`).

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| WebSocket errors lack `code` | `{"error": str(e)}` only (`SocketHandler.error`). Missing-field messages are msgspec's "Object missing required field `type`" rather than the canonical `missing required 'type' parameter` from #1228. | Envelope with `code` and the canonical messages (D1, D4). | Share an error mapper with the HTTP handler; restore the messages when decoding. | 13 |
| Arrow Content-Type | `application/octet-stream` (`server.py`). | `application/vnd.apache.arrow.stream` (D8). | Change the header; the body is already a stream. | 14 |
| HTTP errors are plain text | `handler.error()` ends the response with `str(error)` and no Content-Type; missing-field messages are msgspec's rather than the canonical ones from #1228. | JSON `Error` envelope (D4). | Emit `{error, code}` with `application/json`. | 8 |
| Empty `sql` | `msgspec` accepts `""`, then `get_arrow_bytes` fails on a `None` result (500). | 400 `bad_request` (D1). | Add `min_length=1` to the struct or validate before dispatch. | 1 |
| Parse errors are 500 | Every DuckDB exception is `handler.error(e)` with the default 500. | `bad_request` for `duckdb.ParserException` (D7). | Map exception classes to codes. | 2 |
| `preagg` is unknown | `msgspec` rejects it as an invalid enum value. | `unsupported_command` (D6). | Accept the literal and answer `unsupported_command` until implemented. | 1 |
| GET reads `?query=<json>` | The flat form is rejected with `missing required 'query' parameter`; the JSON form runs `exec`. | Flat `type`/`sql`, `arrow` only, read-only SQL (D2, D3, D3a). | Read flat parameters; reject `exec`/`preagg`; check the statement kind with `duckdb.extract_statements()`. | 10 |
| Multi-statement `arrow` | All statements run and the last result is returned. | `bad_request` (D16). | Count statements with `duckdb.extract_statements()`. | 3 |
| Unsupported method is 400 | `Unsupported HTTP method` with status 400 and no `Allow`. | 405 with `Allow` and the envelope (D5). | Change the status and add the header. | 2 |
| WebSocket message size | uWebSockets default `max_payload_length` of 16 KiB; larger frames close with 1006. | Accept at least 1 MiB (D13). | Set `max_payload_length` in the `app.ws` options. | 1 |
| CORS | `Access-Control-Request-Method` is emitted as a response header; no `Access-Control-Expose-Headers`. | Drop the request header; expose `ETag` if caching is ever added. | Edit `CORS_HEADERS`. | not observable |
| Concurrency | A synchronous handler blocks the event loop for every connection. | No wire requirement; prerequisite for deadlines. | Run queries in a thread pool. | not observable |

<details><summary>Case ids</summary>

- **WebSocket errors lack `code`**: `ws/missing-type`, `ws/missing-sql`, `ws/empty-sql`, `ws/unknown-type`, `ws/type-not-a-string`, `ws/preagg-unsupported`, `ws/sql-parse-error`, `ws/sql-unknown-table`, `ws/sql-runtime-error`, `ws/exec-error`, `ws/ws-malformed-json-stays-open`, `ws/ws-missing-sql-stays-open`, `ws/ws-sql-error-stays-open`
- **Arrow Content-Type**: `post/arrow-stream-format`, `post/arrow-empty-result`, `post/arrow-scalar-types`, `post/arrow-many-rows`, `post/arrow-from-parquet`, `post/arrow-trailing-semicolon`, `post/application-fields-pass-through`, `post/protocol-fields-not-shadowed`, `post/content-type-not-json`, `post/content-type-with-charset`, `post/arrow-cors-origin`, `post/large-request-1mib`, `post/exec-acknowledged`, `post/exec-multi-statement`
- **HTTP errors are plain text**: `post/missing-type`, `post/missing-sql`, `post/unknown-type`, `post/type-not-a-string`, `post/malformed-json-body`, `post/sql-unknown-table`, `post/sql-runtime-error`, `post/exec-error`
- **Empty `sql`**: `post/empty-sql`
- **Parse errors are 500**: `post/sql-parse-error`, `connector/rest-error`
- **`preagg` is unknown**: `post/preagg-unsupported`
- **GET reads `?query=<json>`**: `get/get-arrow`, `get/get-plus-in-sql`, `get/get-cte-allowed`, `get/get-set-operation-allowed`, `get/get-missing-type`, `get/get-json-wrapped-query-rejected`, `get/get-exec-rejected`, `get/get-preagg-rejected`, `get/get-ddl-rejected`, `get/get-delete-returning-rejected`
- **Multi-statement `arrow`**: `post/arrow-multi-statement`, `ws/arrow-multi-statement`, `ws/ws-pipeline-order`
- **Unsupported method is 400**: `post/method-put`, `post/method-head`
- **WebSocket message size**: `ws/large-request-1mib`

</details>

## Node `@uwdata/mosaic-duckdb`

Configuration: `@uwdata/mosaic-duckdb` data server (`packages/server/duckdb`).

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| HTTP errors are plain text | `res.error()` writes `String(err)` with no Content-Type (`data-server.js`). | JSON `Error` envelope with `application/json` on every failure (D4). | Rewrite `error()` to emit `{error, code}`. | 7 |
| WebSocket errors lack `code` | `{"error": String(err)}` with an `Error:` prefix; the status argument is dropped (`data-server.js`). | Envelope with `code` (D4). | Share the HTTP error mapper. | 9 |
| `sql` is not validated | A missing or empty `sql` reaches DuckDB and fails as a binder or parser error (500). | 400 `bad_request` with `missing required 'sql' parameter` (D1). | Validate before dispatch. | 5 |
| Parse errors are 500 | DuckDB parser errors surface as `internal_error`. | `bad_request` (D7). | Classify `Parser Error` before falling through to 500. | 3 |
| `preagg` is unknown | `Unrecognized command: preagg` as a generic bad request. | `unsupported_command` (D6). | Recognise the command and answer `unsupported_command` until implemented. | 2 |
| GET is broken | `JSON.parse` is applied to the already-parsed query object, so every GET is a 400 `TypeError` (`data-server.js`). | Flat `type`/`sql` parameters, `arrow` only, read-only SQL (D2, D3, D3a). | Build the command from `url.query`; reject `exec`/`preagg`; check the statement kind with `json_serialize_sql`. | 10 |
| Empty Arrow result is 0 bytes | `DuckDB.js` returns no bytes for zero rows; `duckdb.test.js` asserts it. | Schema message plus end-of-stream marker (D8). | Emit a schema-only stream. | 2 |
| Trailing `;` and multi-statement `arrow` | SQL is wrapped as `to_arrow_ipc((sql))`, so a trailing `;` is a parser error (500) and several statements fail the same way. | Trailing `;` allowed; several statements are `bad_request` (D16). | Strip a trailing `;`; count statements before wrapping. | 4 |
| Unsupported method is 400 | `Unsupported HTTP method` with status 400 and no `Allow`. | 405 with `Allow: GET, POST, OPTIONS` and the envelope (D5). | Change the status and add the header. | 2 |
| Shared DuckDB connection | One connection serves every client (`DuckDB.js`). | No requirement. | Note only. | not observable |

<details><summary>Case ids</summary>

- **HTTP errors are plain text**: `post/missing-type`, `post/unknown-type`, `post/type-not-a-string`, `post/malformed-json-body`, `post/sql-unknown-table`, `post/sql-runtime-error`, `post/exec-error`
- **WebSocket errors lack `code`**: `ws/missing-type`, `ws/unknown-type`, `ws/type-not-a-string`, `ws/sql-unknown-table`, `ws/sql-runtime-error`, `ws/exec-error`, `ws/ws-malformed-json-stays-open`, `ws/ws-sql-error-stays-open`, `ws/ws-pipeline-order`
- **`sql` is not validated**: `post/missing-sql`, `post/empty-sql`, `ws/missing-sql`, `ws/empty-sql`, `ws/ws-missing-sql-stays-open`
- **Parse errors are 500**: `post/sql-parse-error`, `ws/sql-parse-error`, `connector/rest-error`
- **`preagg` is unknown**: `post/preagg-unsupported`, `ws/preagg-unsupported`
- **GET is broken**: `get/get-arrow`, `get/get-plus-in-sql`, `get/get-cte-allowed`, `get/get-set-operation-allowed`, `get/get-missing-type`, `get/get-json-wrapped-query-rejected`, `get/get-exec-rejected`, `get/get-preagg-rejected`, `get/get-ddl-rejected`, `get/get-delete-returning-rejected`
- **Empty Arrow result is 0 bytes**: `post/arrow-empty-result`, `ws/arrow-empty-result`
- **Trailing `;` and multi-statement `arrow`**: `post/arrow-trailing-semicolon`, `ws/arrow-trailing-semicolon`, `post/arrow-multi-statement`, `ws/arrow-multi-statement`
- **Unsupported method is 400**: `post/method-put`, `post/method-head`

</details>

<!-- conformance:end -->
