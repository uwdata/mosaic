# Server conformance

Gap analysis of each server implementation against `openapi.yaml`,
`asyncapi.yaml`, and `schemas.yaml`. The spec describes the *desired* state;
none of the servers fully conform yet. Line references are to `origin/main`
at `b623fb60` and will drift.

Client baseline: `packages/mosaic/core/src/connectors` on
[#1224](https://github.com/uwdata/mosaic/pull/1224), which builds on main
after #1172 (drop `json`), #1213 (drop `persist` and result caches), and
#1209 (socket pipelining).

## Decisions made while drafting

Where the servers disagreed, the spec picks one behaviour. Each is revisable.

| # | Topic | Decision | Alternatives observed |
|---|-------|----------|-----------------------|
| D1 | `type` default | `arrow` when omitted (matches `ArrowQueryRequest.type?` and the Node server). | Python, Rust, Go require it. |
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

## Go `duckdb-server-go`

Source: `packages/server/duckdb-server-go/{main.go,flags.go,pkg/server/*.go,pkg/query/*.go}`. Closest to the target; intended first `preagg` implementation (#1234).

Already conforming: WebSocket error frames carry `code` (`bad_request`, `unauthenticated`, `forbidden`, `internal_error`; `pkg/server/errors.go:31-69`); Arrow IPC stream with EOS marker; GET caching with strong `ETag`, weak `If-None-Match` → 304, strong `If-Match` → 412, `no-store` elsewhere (`pkg/server/cache.go`, `server.go:295-307`); application payload passthrough via `WithAuthorizer` (`pkg/server/authorization.go:75-107`); `Vary` auto-includes schema-match headers.

| Area | Current | Spec | Fix |
|------|---------|------|-----|
| HTTP errors | `http.Error` plain text (`server.go:127-130`); `classifyError` already yields a code | JSON envelope (D4) | Reuse `classifyError`; write `{error,code}` with `application/json`. |
| `ErrExecWithValidation` | `bad_request` (`errors.go`) | `unsupported_command` (D6) | Remap. |
| Parse errors without policy | 500 `internal_error` with raw DuckDB text | 400 `bad_request` (D7) | Run `json_serialize_sql` (or statement extraction) unconditionally, or map DuckDB parser errors. |
| `type` missing | 400 `missing required 'type' parameter` (`server.go:345-362`) | default `arrow` (D1) | Default in `Validate`. |
| Exec over GET | runs (`server.go:264-276`) | 400 `bad_request` (D3) | Reject in GET branch. |
| GET read-only SQL | not checked; `json_serialize_sql` runs only under policy (`query.go:185-209`) | reject non-SELECT roots (D3a) | Run the serializer for GET unconditionally and check the root node class. |
| Multi-statement `arrow` | runs all, returns last (duckdb-go `prepareStmts`) | reject (D16) | Count statements before execution. |
| 405 | plain text, no `Allow` (`server.go:278-281`) | envelope + `Allow` | Set header. |
| 413 | plain `Request Entity Too Large` | envelope `bad_request` | Mapper. Also expose `WithMaxMessageBytes` on the CLI; the binary is unbounded. |
| 401 schema-match | plain `no allowed schemas found in request headers` (`server.go:228-232`) | envelope `unauthenticated` | Mapper. |
| JSON key matching | case-insensitive, last-wins (`encoding/json`); `TYPE` overrides `type` (`metadata_test.go:301`) | protocol fields decoded exactly (D9) | Decode protocol fields with a strict decoder or reject duplicate/case-variant keys. |
| WS malformed JSON | close 1007 via `wsjson.Read` (`server.go:193-198`) | `Error` frame, open (D12) | Read raw, unmarshal manually. |
| WS read limit | 32 KiB library default unless `WithMaxMessageBytes` | ≥ 1 MiB (D13) | Set a default; add CLI flag. |
| WS error frame | trailing `\n` from `json.Encoder` (`server.go:203-207`) | acceptable, but match HTTP body byte-for-byte | Use `json.Marshal`. |
| WS close | always `Close(1011)` on loop exit (`server.go:168-173`) | 1000 on clean client close | Distinguish `CloseError` from other read errors. |
| WS pings | answered only inside `conn.Read` | SHOULD answer during execution | Reader goroutine or `conn.Ping` ticker. |
| WS context | `r.Context()` after hijack; cancellation on disconnect undetermined | needed for deadlines | Derive from connection lifecycle. |
| Upgrade detection | whole-value `EqualFold` on `Connection` (`server.go:102-103`) | token-based | Scan `Connection` tokens. |
| `Cache-Control: private` | operator value used verbatim even with an authorizer | identity → `Vary` or `private` (D14) | Document; optionally add identity headers to `Vary` from `AuthorizeRequest`. |
| `Access-Control-Expose-Headers` | not set (`security.go`) | expose `ETag` | Add to `WithCORS` defaults. |
| Remote URI rejection (#1152) | option only, no CLI flag (`main.go`) | deployment choice | Add flag if it should be reachable from the binary. |
| `name` field | parsed, unused (`server.go:19-24`) | dropped (D15) | Remove. |
| Timeouts | none | `deadline_exceeded` | Per-command deadline; also needed by #1234. |

## Rust `duckdb-server-rust`

Source: `packages/server/duckdb-server-rust/src/{app.rs,query.rs,interfaces.rs,db.rs,websocket.rs,main.rs}`.

| Area | Current | Spec | Fix |
|------|---------|------|-----|
| Arrow body | IPC **file** via `FileWriter` (`db.rs:44`) under stream media type (`interfaces.rs:40`) | IPC stream (D8) | Use `StreamWriter`; update `test.rs:84`. |
| `type` missing | 400 empty (`query.rs:25`) | default `arrow` (D1) | Default in `QueryParams`. |
| `sql` missing | 400 empty | 400 envelope | Add body. |
| Unknown `type` | GET 400 / POST 422 plain serde text (`interfaces.rs:14-19`) | 400 envelope `bad_request` | Custom rejection or `String` + manual match. |
| Malformed JSON | 400 plain `Failed to parse the request body as JSON…` | 400 envelope | Custom `Json` rejection handler. |
| DuckDB error | 500 plain `Something went wrong: …` (`interfaces.rs:62-64`) | 500 envelope `internal_error`; parse errors 400 (D7) | Map `duckdb::Error` variants. |
| Exec over GET | runs | 400 `bad_request` (D3) | Reject in `handle_get`. |
| GET read-only SQL | not checked | reject non-SELECT roots (D3a) | Parse via `json_serialize_sql` or the DuckDB C API statement type before execution. |
| Multi-statement `arrow` | `prepare` fails → 500 | 400 `bad_request` (D16) | Classify. |
| 405 | empty, `Allow: GET,HEAD,POST` | envelope + `Allow: GET, POST, OPTIONS` | Custom fallback. HEAD runs the query today; drop or document. |
| README GET example | `?query={…}` (`Readme.md:47`) does not work | flat params | Fix README. |
| `name` field | parsed, logged, unused (`interfaces.rs:21-27`) | dropped (D15) | Remove. |
| WS errors | `{"error"}` no code (`websocket.rs:29-35`); message differs from HTTP (`Something went wrong:` prefix) | envelope with `code`, same message both transports | Shared mapper. |
| WS binary frames | ignored, **no reply** (`websocket.rs:59`) | SHOULD accept; MUST reply (D11) | Treat as text or answer with `bad_request`. |
| WS upgrade edge | malformed upgrade falls through to GET handler (`app.rs:22-34`) | 400 envelope | Return the upgrade rejection. |
| Cache headers | none | optional (D14) | Straightforward; results are buffered. |
| CORS | `max-age` 86400, no `Expose-Headers` | expose `ETag` | Edit `CorsLayer`. |
| Timeouts | none; blocking DuckDB calls on tokio workers (`db.rs:29-54`) | `deadline_exceeded` | `spawn_blocking` + `duckdb_interrupt`. |

## Python `duckdb-server`

Source: `packages/server/duckdb-server/pkg/{server.py,query.py,__main__.py}`.

| Area | Current | Spec | Fix |
|------|---------|------|-----|
| HTTP error status | CORS `write_header` runs first, so uWS emits `200` and the later `write_status(500)` is ignored (`server.py:71,111,136-140`) — errors are very likely **200** | mapped status | Call `write_status` before any `write_header`. Verify empirically. |
| GET params | `?query=<json>` (`server.py:149-151`) | flat `type`/`sql` (D2) | Read flat params. |
| `type` missing | `KeyError` escapes → `Error 'type'` (`server.py:85`) | default `arrow` (D1) | `query.get("type", "arrow")`. |
| `sql` missing | `Error 'sql'` via `on_error` | 400 envelope | Validate before dispatch. |
| Unknown `type` | `Unknown command X` plain (`server.py:94-96`) | 400 envelope `bad_request` | Classify. |
| Malformed/falsy POST body | `NotImplementedError` → body `Error ` (`server.py:157`) | 400 envelope | Validate `get_json()` result. |
| DuckDB error | plain `str(e)` | 500 envelope; parse errors 400 (D7) | Map `duckdb.ParserException`/`BinderException`. |
| Arrow Content-Type | `application/octet-stream` (`server.py:67`) | `application/vnd.apache.arrow.stream` (D8) | Change header; body is already a stream. |
| Exec over GET | runs | 400 `bad_request` (D3) | Reject. |
| GET read-only SQL | not checked | reject non-SELECT roots (D3a) | `duckdb.extract_statements()` exposes the statement type. |
| Non-GET/POST/OPTIONS | no response; hangs until uWS timeout (`server.py:146-157`) | 405 + `Allow` + envelope | Add fallthrough. |
| WS missing `sql`/`type` | **no frame at all** (exception in sync handler) | `Error` frame (D11) | Wrap `handle_query` in try/except. Breaks pipelining clients today. |
| WS errors | `{"error"}` no code | envelope with `code` | Add. |
| WS message size | 16 KiB default | ≥ 1 MiB (D13) | Set `max_payload_length`. |
| WS idle | 120 s close, no pings | SHOULD ping | `send_pings_automatically` or raise idle timeout. |
| CORS | bogus `Access-Control-Request-Method`, no `Expose-Headers` (`server.py:136-140`) | fix | Edit header set. |
| Concurrency | single connection, sync handler blocks the event loop | (prerequisite for deadlines) | Not a wire gap. |
| CLI | positional db path only; port hardcoded 3000 (`server.py:174`) | runner needs `--port` | Add `--port`/`--address`. |

## Node `packages/server/duckdb`

Source: `packages/server/duckdb/src/{data-server.js,DuckDB.js}`, `bin/run-server.js`. README steers users to the Python server; decide whether this server is in scope for the conformance suite or retired. If kept:

| Area | Current | Spec | Fix |
|------|---------|------|-----|
| GET | always 400: `JSON.parse` of the parsed query object (`data-server.js:39-40,76`) | flat params (D2) | Build the command from `url.query`. |
| GET read-only SQL | n/a (GET broken) | reject non-SELECT roots (D3a) | Needed once GET works; `json_serialize_sql` via the same connection. |
| `sql` missing | not validated → DuckDB parser error → 500 | 400 `bad_request` | Validate. |
| Non-string / `null` `type` | `Unrecognized command: null` 400 | fine, but body empty | Envelope. |
| HTTP errors | **empty body**, no Content-Type (`data-server.js:119-123`) | envelope (D4) | Rewrite `error()`. |
| Unsupported method | 400 (`data-server.js:49-50`) | 405 + `Allow` | Change status. |
| Empty Arrow result | 0 bytes (`DuckDB.js:91`; `duckdb.test.js:26-30` asserts it) | schema + EOS (D8) | Emit a schema-only stream. |
| Arrow trailing `;` / multi-statement | wrapped as `to_arrow_ipc((sql))` (`DuckDB.js:88-90`) → parser error 500 | trailing `;` allowed; multi → 400 (D16) | Strip trailing `;`; classify. |
| WS error | `{"error": String(err)}` with `"Error: "` prefix; status argument dropped (`data-server.js:141-144`) | envelope with `code` | Rewrite. |
| WS ordering | serialized per connection since #1209 (`data-server.js:58-65`) | in order (D11) | Conforms. |
| Shared connection | one DuckDB connection for all clients (`DuckDB.js:21`) | (no spec requirement) | Note only. |
| CLI | positional db path only; no `--port`; not in `package.json` `bin` (`bin/run-server.js:5`) | runner needs `--port` | Add flags. |
| Wire tests | none | — | Conformance suite will cover. |

## Conformance suite sketch

Declarative cases in `packages/server/spec/cases/*.yaml`, one TypeScript runner
(vitest) that:

1. Starts a server from a per-server adapter (`command`, `args`, `readyProbe`,
   `capabilities: { preagg, exec, caching, tenantHeaders }`) on a free port.
2. Loads a fixture database (`data/` already exists in each server package;
   prefer one shared parquet file).
3. Runs each case over HTTP and WebSocket, asserting status, headers, frame
   type, and body against `schemas.yaml` (ajv 2020-12) plus case-specific
   expectations. Arrow bodies are decoded with Flechette and compared as row
   objects against an in-process DuckDB result for the same SQL.
4. Pipelines several WebSocket commands, including deliberately invalid ones,
   and asserts positional correlation (D11).
5. Skips cases whose `requires` capability the adapter lacks, but fails if the
   server returns anything other than `unsupported_command` for them.

Case groups: request decoding (D1–D3a, D9, D10), Arrow encoding (D8, D16),
error envelope per code (D4–D7), WebSocket framing/order/open-after-error
(D11, D12), size floors (D13), caching headers (D14), CORS preflight.
