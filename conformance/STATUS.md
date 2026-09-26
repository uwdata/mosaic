# Server conformance

Gap analysis of each server implementation against `openapi.yaml`,
`asyncapi.yaml`, and `schemas.yaml`. The spec describes the *desired* state;
none of the servers fully conform yet. The per-server tables at the end are
generated from `known-failures/*.yaml`, which the conformance suite in this
directory also reads, so a gap and its test stay in step.

Client baseline: `packages/mosaic/core/src/connectors` on main after #1172
(drop `json`), #1213 (drop `persist` and result caches), #1209 (socket
pipelining), and #1228 (`type` required). The `preagg` command is implemented
by [#1224](https://github.com/uwdata/mosaic/pull/1224), stacked on this PR.

## Decisions made while drafting

Where the servers disagreed, the spec picks one behaviour. Each is revisable.

| # | Topic | Decision | Alternatives observed |
|---|-------|----------|-----------------------|
| D1 | `type` required | Required; missing → `400 bad_request` / `missing_field` with `field: type`, as settled by #1228 across the client types and all four servers. An earlier revision of this spec also required #1228's exact message text; D19 replaced that with `reason`/`field`. | An earlier draft defaulted to `arrow` when Node did; #1228 removed that default. |
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
| D19 | `reason` and `field` | The envelope is `{code, reason, error}` plus code-specific fields. `code` is the coordinator's broad action; `reason` is a closed, specific classification bound to exactly one code by the schema (`ErrorReason`); `error` is human-readable and not contractual. `missing_field`/`invalid_field` carry `field`, the top-level request property concerned; other reasons prohibit it. The conformance suite asserts `code`/`reason`/`field` and never message wording. | Requiring identical messages across four servers (the earlier D1) broke within a week when Python's msgspec messages replaced the canonical text; a `bad_request` alone conflated malformed JSON, missing fields, parse errors, wrong methods, oversized bodies, and cache preconditions, and WebSocket has no status to tell them apart. |
| D20 | Nested `TableReference` | One `{catalog, schema: string[], table}` object, used as `PreaggResponse.reference` and as `Error.reference` on `table_not_found` (required there, prohibited elsewhere). Components are raw identifiers, quoted separately by the client; `schema` is a path so engines with nested namespaces fit without a dotted string. Flat `catalog`/`schema`/`table` are prohibited on the envelope. Coordinated with #1224 (client) and #1234 (Go `preagg`) while both are unmerged. | Three sibling fields needed `if/then/else` validation to stop partial references and leaks on unrelated codes, and `PreaggResponse` repeated the same triple with a string `schema`. |
| D21 | `diagnostics` | Optional array of typed findings (`message`, `provider`, `rule`, `subject`, `location`) on any error; `subject` is a `table` or `function` with the D20 namespace components; `location` is zero-based UTF-8 byte offsets with an exclusive `end`. Diagnostics may be incomplete or omitted, never authorize or trigger recovery, and are subject to the deployment's disclosure policy. Gatekeeper violations map one-to-one; its successful-binding evidence (`objects`, `functions`, `caller_objects`) is not an error diagnostic. | Gatekeeper already returns per-violation rule, message, object, function, and position; without a typed shape each server would flatten them into `error` text or invent a `details` bag. |
| D22 | `diagnosticId` and `retryAfterMs` | `diagnosticId` is an optional server-generated opaque id of one command attempt, also sendable as `X-Request-Id` over HTTP (equal when both present); clients never supply it and WebSocket replies stay positional. `retryAfterMs` is an optional non-negative advisory delay, only on `resource_exhausted`; HTTP `Retry-After` is `ceil(retryAfterMs / 1000)`. No generic `retryable` flag. | A client-supplied request id would become a correlation channel by habit and erode D11; whether a retry is safe depends on the command's publication guarantee, not on the error. |
| D24 | Command layer | Cases free of encoding concerns also run through a `Connector`: the real `restConnector`/`socketConnector` against a server (all cases on the reference server, `smoke: true` cases on the rest), and in-process connectors as targets of their own. At that layer a result must decode to the expected table in whatever IPC framing (D8 is a wire rule; `Connector` promises decodable `ArrowIPCBytes`), `exec` resolves `undefined`, rejections carry `code`/`reason`/`field`/`reference` as structured properties, and concurrent calls are checked for association rather than order. Encoded size, GET semantics, framing, headers, and positional ordering stay wire-only. | Running the six hand-written connector smoke cases only; applying the stream/EOS framing checks to connectors, which would have flagged behaviour the coordinator does not depend on. |
| D25 | Comm correlation | Over the widget's Jupyter comm every message gets exactly one reply, correlated by a client-chosen `uuid` unique among its outstanding requests. `uuid` is validated before anything else: absent is `missing_field`, present but not a non-empty string is `invalid_field`, both with `field: uuid`, replied with `uuid: null`, and no SQL runs. Replies may arrive in any order; clients must log and drop `null` or unknown `uuid`s (a client-side test, not this suite). | The widget echoes whatever `uuid` it received, including `""` and `42`, and runs the command anyway; a missing `uuid` raises `KeyError` before the `try`, so no reply is sent and the JS promise hangs. |
| D26 | Comm framing | Replies are a flat `{type, uuid}` envelope with the payload nested: `arrow` as exactly one IPC-stream buffer, `exec` bare, `preagg` under `result` (`PreaggResponse`), errors under `error` (`Error`). `ExecResponse` and `PreaggResponse` are closed objects, so spreading them into the envelope is not possible; nesting the error too keeps one shape. An implementation without preaggregation answers `preagg` with `unsupported_command` / `command_disabled`. | The widget sends `{error: "<text>", uuid}`, which the JS side detects by truthiness and rejects as a raw string. |
| D23 | Failure guarantees | `arrow` and `preagg` publish nothing on failure and `preagg` publication is atomic. `exec` guarantees neither atomicity nor rollback: a later statement may fail after earlier ones took effect, committed effects may remain, an explicit transaction follows the engine's transaction semantics, and the server never retries on the client's behalf. `deadline_exceeded` follows the same per-command rule. `ReadOnlySql` prohibits state changes anywhere in the statement, not only at the root. Cancellation is out of scope. | DuckDB has no data-modifying CTEs, so the nested-DML rule is unobservable on the reference servers and stated for engines that do. An earlier wording said the server "does not roll back", which would have forbidden cleaning up an aborted transaction before a pooled connection is reused. |

## Common gaps (all four servers)

- No JSON error envelope over HTTP (D4).
- No `preagg` command; must return `400 unsupported_command`, not an unknown-type error.
- No `reason` on any envelope (D19), so every error case also records `error.reason.missing` and `error.schema.required.reason` where the body is JSON at all.
- No `deadline_exceeded`, `resource_exhausted`, or `table_not_found` paths; only Go has `unauthenticated`.
- `exec` runs over GET where GET works at all (D3), and no server checks that GET SQL is read-only (D3a).
- `Access-Control-Request-Method: *` is emitted as a *response* header by Python and Node (it is a request header). No server sets `Access-Control-Expose-Headers`, so browsers cannot read `ETag` cross-origin.
- No server sends `Allow` on 405.

The in-process connectors (`node-connector`, `wasm`) share two more: neither
validates `type`, so a malformed command runs as `arrow`, and neither maps
engine exceptions to a `code`, so the coordinator cannot tell a parse error
from a missing table. Both are client-side fixes in `@uwdata/mosaic-core`;
#1224 adds the `ConnectorError` type they need.

## Conformance suite

The suite is a vitest project that points at one target, replays the
declarative cases from `cases/*.yaml`, and checks every response against
`schemas.yaml` with Ajv plus the case's own expectations. Arrow bodies are
decoded with Flechette and compared as rows.

```sh
CONFORMANCE_TARGET=go pnpm -F @uwdata/mosaic-conformance suite
```

Targets are defined in `implementations/index.ts`: the servers `node`,
`python`, `rust`, `go`, `go-cache`, `go-gatekeeper`, the in-process
connectors `node-connector` and `wasm`, and the Python `widget`, whose comm
handler is driven over stdio by `packages/vgplot/widget/conformance/shim.py`
(the Python callback boundary, not Jupyter's message scheduling; the JS side
of the widget is out of reach here). Each declares capabilities
(`exec`, `preagg`, `caching`, `files`, `policy`), which cases gate on with
`requires`/`unless`, and transports. Wire transports (`post`, `get`, `ws`)
check the encoded protocol; command transports (`rest`, `socket`, `inproc`)
check what the coordinator sees through a `Connector` (D24). A case runs at
the command layer unless something in it is about encoding, or it says
`layers: [wire]`; `applicability.test.ts` pins the classification of every
case. Server targets run the command layer through the real client
connectors: `go` over the whole corpus, the others over `smoke: true` cases.
A server target is spawned on a free port; `CONFORMANCE_URL` points the
suite at one already running. Server output is written to
`.logs/<target>.log`. Cases a target does not run are skipped with a
category, `capability` or `layer`, that the results file records.

The suite is a ratchet over individual violations. Every mismatch a check
finds has a stable id (`error.status.500`, `error.reason.execution_failed`,
`error.field.missing`, `error.not-json`, `arrow.eos`, `header.allow`,
`ws.closed.1007`, `s2.arrow.rows` for step 2 of a multi-step case, and so on), and `known-failures/<config>.yaml` records, per
case, exactly which ids the server produces today, grouped by area with the
observed behaviour and the fix. A run is green when each case's observed
violations equal its listed ids. A new violation on any case, including one
already listed for something else, fails the run as a regression; a listed
violation that stops appearing also fails the run until it is removed, so
the lists only shrink. An entry written `a|b` means exactly one of the two
is observed on any given run, for server behaviour that races (a reset
against a 505). Thrown transport or harness errors are never baselined:
only a connection the server tears down after accepting the request is
recorded, as `http.reset.peer-closed` or `http.reset.socket-closed` before a
status line and `http.reset.after-<status>.<reset>` once one was received, so
a truncated 505 rejection and a truncated 200 result never share an id;
refusals, bad URLs, DNS or TLS failures, and timeouts fail the run. The same
line is drawn at the command layer: a rejection the client connector raises
because the request never left (undici's `fetch failed` without a post-send
reset, a WebSocket `error` event) is a harness error, while an engine or
server error the connector passes through is an observation. A server that
accepts the request and then drops the connection is recorded under its own
id (`connector.reset.peer-closed`, `connector.reset.body.socket-closed`,
`connector.reset.socket-closed`), never as a missing envelope. A step that
reaches its deadline on any transport is recorded where that is an
observation (`ws.no-reply`, `connector.no-reply`, `comm.timeout`; an HTTP
timeout is a harness error), the rest of that case is blocked, and the
target is restored to a known state before the next case: an in-process
engine or the shim is disposed and rebuilt, and a server the suite spawned
is stopped and started again, taking the client sessions bound to it along.
A server the suite did not start (`CONFORMANCE_URL`) cannot be restored, so
there every later case, on any transport, fails as a harness error before
sending anything. The shim's own protocol is validated record by record;
a malformed or duplicate record is a harness error, never a reply. Every step of a multi-step case runs even after an earlier step
misbehaved, so follow-up checks such as "the connection is still usable" or
"the table was not created" are observed independently. After the last
expected WebSocket reply the socket is watched for a further
`CONFORMANCE_SETTLE_TIMEOUT` (250 ms); any frame that still arrives is a
reply the positional client would hand to the wrong command and is recorded
as `ws.surplus-reply` (D11). Full conformance is
reached when the files are empty. `go-cache` and `go-gatekeeper` inherit the
plain `go` list and override per case or exempt cases (`passes`).

To add a case, append it to a file in `cases/` with the decision
ids it exercises, run every configuration, add the observed violation ids to
the matching `known-failures` file (the run's summary lists them), then
regenerate the tables below. After fixing a server, `baseline`
rewrites the ids of already-listed cases from the last run and drops the
ones that now pass; new failures still have to be filed under an area by
hand, and a run that contains harness errors is refused, since those are
unknown observations rather than passes. Only observed cases are touched, so
a filtered run leaves the other entries and `passes` exemptions as they
were, and a case listed under several areas keeps each area's own ids,
with ids no area owns reported for placement rather than copied into every
area. For an inheriting configuration, a case the parent skips by capability
(the results record the reason) counts as having no inherited failures,
while a case the parent's last run left out through a filter is left
untouched and reported as unverified instead of being compared against
nothing. A parent's entries for cases the child never expands, such as the
full command corpus only the reference server runs, are not inherited.

```sh
CONFORMANCE_TARGET=go pnpm -F @uwdata/mosaic-conformance baseline
pnpm -F @uwdata/mosaic-conformance status
```

`pnpm -F @uwdata/mosaic-conformance test` runs the harness's own unit tests
(one file per module: the checker, the schema rules, the command layer and
sessions, the runner's timeout recovery, the comm client, case
applicability, and the baseline updater) without a target; the root
`pnpm test` includes them.

CI runs all nine targets on every pull request that touches a server
or the spec (`.github/workflows/conformance.yml`) and fails if the tables
below are stale.

Not observable from outside, so still tracked by hand (`cases: {}`):
authorizer-based `unauthenticated` responses and tenant `Vary` headers (no
CLI exposes an authorizer), timeouts, and internal structure such as shared
connections. Policy denials (`forbidden`) are observable and covered under
the `go-gatekeeper` configuration. `diagnostics`, `diagnosticId`, and
`retryAfterMs` are optional, so their presence and wording are never
baselined; when present their structure is schema-checked and
`X-Request-Id`/`Retry-After` must agree with the envelope. Nested schema
paths (D20) are exercised structurally by the harness tests; an execution
case needs an engine with nested namespaces and would be gated on a
capability none of the reference servers has.


<!-- conformance:begin -->
<!-- Generated from known-failures/*.yaml by generate-conformance-md.ts. Edit the YAML, then run `pnpm -F @uwdata/mosaic-conformance status`. -->

## Go `duckdb-server-go`

Configuration: `duckdb-server-go` with default flags. Transports: post, get, ws, rest, socket.

Closest to the target and the intended first `preagg` implementation (#1234). Already conforming: WebSocket error frames carry `code` (`pkg/server/errors.go`), though not yet `reason` (D19); Arrow IPC stream with the end-of-stream marker; GET caching with a strong `ETag`, weak `If-None-Match` → 304, strong `If-Match` → 412, `no-store` elsewhere (`pkg/server/cache.go`); application payload passthrough via `WithAuthorizer` (`pkg/server/authorization.go`); `Vary` auto-includes schema-match headers.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| HTTP errors are plain text | `http.Error` writes `text/plain` even though `classifyError` already yields a code (`pkg/server/server.go`). | JSON `Error` envelope (D4, D19). | Reuse `classifyError`; write `{error, code, reason}` with `application/json`. | 12 |
| Parse errors are 500 without a policy | `json_serialize_sql` runs only under validation, so a syntax error is an unclassified `internal_error`. | `bad_request` regardless of policy (D7). | Run statement extraction unconditionally, or map DuckDB parser errors. | 5 |
| `preagg` is unknown | `invalid 'type' parameter: preagg` as `bad_request`. | `unsupported_command` (D6). Go is the intended first `preagg` implementation (#1234). | Recognise the command and answer `unsupported_command` until implemented. | 2 |
| WebSocket errors lack `reason` | Frames carry `{code, error}` from `classifyError` (`pkg/server/errors.go`) but no `reason` or `field`, so a client cannot tell a missing field from an invalid one without parsing the message. | `reason`, and `field` for the field reasons (D19). | Extend `classifyError` to return a reason and, for decode failures, the property name; the HTTP envelope fix then inherits both. | 9 |
| Exec and side effects over GET | GET runs `exec` and does not check the statement kind, so `CREATE TABLE` and `DELETE ... RETURNING` execute (`server.go`). | `arrow` only (D3); read-only root required (D3a). | Reject `exec` in the GET branch; run the `json_serialize_sql` walker for GET unconditionally. | 3 |
| Multi-statement `arrow` | duckdb-go `prepareStmts` runs every statement and returns the last result. | `bad_request` (D16). | Count statements before execution. | 5 |
| JSON keys match case-insensitively | `encoding/json` lets `TYPE: exec` override `type: arrow`; the request ran as `exec` and returned an empty body. | Protocol fields decoded exactly; application fields must not shadow them (D9). | Decode protocol fields with a strict decoder or reject case-variant duplicates. | 4 |
| 405 without `Allow` | `Method not allowed` plain text, no `Allow` header. | Envelope plus `Allow: GET, POST, OPTIONS` (D5). | Set the header in the fallback branch. | 2 |
| WebSocket malformed JSON closes the socket | `wsjson.Read` failure closes with 1007 (`server.go`); through the socket connector every queued query then fails with `Socket closed`. | `Error` frame, connection stays open (D12). | Read the raw frame and unmarshal manually. | 3 |
| WebSocket read limit | 32 KiB library default; larger frames close with 1009. | Accept at least 1 MiB (D13). | Set a default via `WithMaxMessageBytes` and expose a CLI flag. | 1 |
| Client connectors expose no error code | `restConnector` rejects with `Error('Query failed with HTTP status …')` and `socketConnector` with the frame's `error` string, so the coordinator sees no `code`, `reason`, or `field` even where the server sent them (WebSocket frames from this server already carry `code`). | Rejections carry the envelope's `code`, `reason`, and `field` as structured properties (D19, D24). | #1224 adds `ConnectorError` with `code`, `status`, and `reference`; `reason` and `field` need a follow-up there. Over HTTP the code also depends on the envelope fix above. | 25 |
| 401 schema-match is plain text | `no allowed schemas found in request headers` via `http.Error`. | Envelope with `unauthenticated`. | Same mapper as the other HTTP errors. Needs an authorizer, which the CLI does not expose, so the suite cannot observe it. | not observable |
| WebSocket close code and pings | Always `Close(1011)` on loop exit; pings are answered only inside `conn.Read`. | 1000 on a clean client close; SHOULD answer pings during execution. | Distinguish `CloseError`; add a reader goroutine or ping ticker. | not observable |
| Upgrade detection | Whole-value `EqualFold` on `Connection` (`server.go`). | Token-based matching. | Scan `Connection` tokens. | not observable |
| Timeouts | None. | `deadline_exceeded`; also needed by #1234. | Per-command deadline. | not observable |

<details><summary>Baselined violations by case</summary>

- **HTTP errors are plain text**
  - `post/missing-type`: `error.content-type`, `error.not-json`
  - `post/missing-sql`: `error.content-type`, `error.not-json`
  - `post/empty-sql`: `error.content-type`, `error.not-json`
  - `post/unknown-type`: `error.content-type`, `error.not-json`
  - `post/type-not-a-string`: `error.content-type`, `error.not-json`
  - `post/malformed-json-body`: `error.content-type`, `error.not-json`
  - `post/sql-unknown-table`: `error.content-type`, `error.not-json`
  - `post/sql-runtime-error`: `error.content-type`, `error.not-json`
  - `post/exec-error`: `error.content-type`, `error.not-json`
  - `get/get-missing-type`: `error.content-type`, `error.not-json`
  - `get/get-json-wrapped-query-rejected`: `error.content-type`, `error.not-json`
  - `get/get-preagg-rejected`: `error.content-type`, `error.not-json`
- **Parse errors are 500 without a policy**
  - `rest/sql-parse-error`: `error.status.500`
  - `rest/ws-pipeline-order`: `s4.error.status.500`
  - `post/sql-parse-error`: `error.status.500`, `error.content-type`, `error.not-json`
  - `ws/sql-parse-error`: `error.code.internal_error`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-pipeline-order`: `s4.error.code.internal_error`, `s2.error.schema.required.reason`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.schema.required.reason`, `s4.error.reason.missing`
- **`preagg` is unknown**
  - `post/preagg-unsupported`: `error.content-type`, `error.not-json`
  - `ws/preagg-unsupported`: `error.code.bad_request`, `error.schema.required.reason`, `error.reason.missing`
- **WebSocket errors lack `reason`**
  - `ws/missing-type`: `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/missing-sql`: `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/empty-sql`: `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/unknown-type`: `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/sql-unknown-table`: `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-runtime-error`: `error.schema.required.reason`, `error.reason.missing`
  - `ws/exec-error`: `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-missing-sql-stays-open`: `s1.error.schema.required.reason`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `ws/ws-sql-error-stays-open`: `s1.error.schema.required.reason`, `s1.error.reason.missing`
- **Exec and side effects over GET**
  - `get/get-exec-rejected`: `s1.error.status.200`, `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.rows`
  - `get/get-ddl-rejected`: `s1.error.status.200`, `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.rows`
  - `get/get-delete-returning-rejected`: `s2.error.status.200`, `s2.error.content-type`, `s2.error.not-json`, `s3.arrow.rows`
- **Multi-statement `arrow`**
  - `rest/arrow-multi-statement`: `error.resolved`
  - `socket/arrow-multi-statement`: `error.resolved`
  - `post/arrow-multi-statement`: `error.status.200`, `error.content-type`, `error.not-json`
  - `ws/arrow-multi-statement`: `error.frame`
  - `get/arrow-multi-statement`: `error.status.200`, `error.content-type`, `error.not-json`
- **JSON keys match case-insensitively**
  - `rest/protocol-fields-not-shadowed`: `arrow.decode`
  - `socket/protocol-fields-not-shadowed`: `arrow.not-bytes`
  - `post/protocol-fields-not-shadowed`: `arrow.content-type`, `arrow.empty`
  - `ws/protocol-fields-not-shadowed`: `arrow.frame`
- **405 without `Allow`**
  - `post/method-put`: `error.content-type`, `error.not-json`, `header.allow`
  - `post/method-head`: `header.allow`
- **WebSocket malformed JSON closes the socket**
  - `ws/ws-malformed-json-stays-open`: `s1.ws.closed.1007`, `s2.ws.closed.1007`
  - `ws/type-not-a-string`: `ws.closed.1007`
  - `socket/type-not-a-string`: `connector.reset.socket-closed`
- **WebSocket read limit**
  - `ws/large-request-1mib`: `ws.closed.1009`
- **Client connectors expose no error code**
  - `rest/empty-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `rest/exec-error`: `error.code.missing`, `error.reason.missing`
  - `rest/missing-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `rest/missing-type`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `rest/preagg-unsupported`: `error.code.missing`, `error.reason.missing`
  - `rest/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `rest/sql-runtime-error`: `error.code.missing`, `error.reason.missing`
  - `rest/sql-unknown-table`: `error.code.missing`, `error.reason.missing`
  - `rest/type-not-a-string`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `rest/unknown-type`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `rest/ws-missing-sql-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `rest/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `rest/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
  - `socket/empty-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `socket/exec-error`: `error.code.missing`, `error.reason.missing`
  - `socket/missing-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `socket/missing-type`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `socket/preagg-unsupported`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-runtime-error`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-unknown-table`: `error.code.missing`, `error.reason.missing`
  - `socket/unknown-type`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `socket/ws-missing-sql-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `socket/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `socket/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`

</details>

### With `--cache-control`

Configuration: `duckdb-server-go --cache-control='public, max-age=60'`. Transports: post, get, ws; smoke cases over rest, socket.
Everything in the Go `duckdb-server-go` table applies here too (47 inherited cases). Only the differences are listed.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| 412 is plain text | `Precondition Failed` via `http.Error` (`pkg/server/cache.go`). | `bad_request` envelope, no `ETag` (D14, D5). | Same mapper as the other HTTP errors. | 1 |
| Errors under caching are still plain text | The GET parse-error path returns 500 plain text; `Cache-Control: no-store` is present. | 400 envelope with `no-store` (D7, D14). | Covered by the envelope and parse-error fixes in go.yaml. | 1 |
| `ETag` is not exposed to browsers | No `Access-Control-Expose-Headers` on the cross-origin GET, so a browser cannot read the `ETag` (`security.go`). | Expose `ETag` when caching is enabled (D14). | Add to the `WithCORS` defaults. | 1 |
| `Cache-Control: private` with an authorizer | The operator value is used verbatim even when an authorizer varies the response by identity. | Identity headers in `Vary`, or `private`/`no-store` (D14). | Document; optionally append identity headers to `Vary` from `AuthorizeRequest`. | not observable |

<details><summary>Baselined violations by case</summary>

- **412 is plain text**
  - `get/cache-if-match`: `s1.error.content-type`, `s1.error.not-json`, `s3.error.content-type`, `s3.error.not-json`
- **Errors under caching are still plain text**
  - `get/cache-error-no-store`: `error.status.500`, `error.content-type`, `error.not-json`
- **`ETag` is not exposed to browsers**
  - `get/cache-get-etag`: `s1.header.access-control-expose-headers`

</details>

### With `--gatekeeper`

Configuration: `duckdb-server-go --gatekeeper='{"version":1,"options":{}}'`; validation disables `exec` and denies local file access. Transports: post, get, ws; smoke cases over rest, socket.
Everything in the Go `duckdb-server-go` table applies here too (30 inherited cases). Only the differences are listed.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| Disabled `exec` is `bad_request` | `ErrExecWithValidation` maps to `bad_request` (`pkg/server/errors.go`); an application field spelled `TYPE: exec` also trips it, see D9 in go.yaml. | `unsupported_command` (D6). | Remap in `classifyError`. | 2 |
| Gatekeeper rejections are `forbidden` or `bad_request` regardless of cause | A multi-statement `arrow` is `forbidden` (403) and an unknown table is `bad_request` (400 `Bad Request`) because Gatekeeper validation fails before DuckDB classifies the statement. | Multi-statement is `bad_request` (D16); an unknown user table is `internal_error` unless classified as a managed table (D7, still open in STATUS.md). | Split validator errors from policy denials when mapping to codes. | 7 |
| Parse error body is `Bad Request` | The status is right but the body is the plain `http.StatusText`. | Envelope with the DuckDB message (D4, D7). | Covered by the envelope fix in go.yaml. | 1 |
| Local file reads are denied | Default Gatekeeper policy rejects `read_parquet` on a local path with 403 `Forbidden`. | Deployment choice; the suite marks this configuration as lacking the `files` capability. Listed so the plain-text body is not lost. | Envelope fix in go.yaml; optionally allow the shared data directory in the test policy. | not observable |
| Default policy denies `information_schema` | The rejection itself has the right status but a plain body, and the follow-up `information_schema.tables` probe is 403 `Forbidden`, so the suite cannot confirm nothing was created. | Envelope on the rejection (D4); the probe is a test limitation, not a spec requirement. | Envelope fix in go.yaml; allow `information_schema` in the test policy or probe differently. | 2 |
| Policy denials are plain text over HTTP and carry no `reason` or diagnostics | A statement the policy forbids is 403 `Forbidden` as `text/plain`; the WebSocket frame carries `code: forbidden` but no `reason`, and the Gatekeeper violations (`rule`, `message`, object, function, position) are folded into the message. | Envelope with `forbidden` / `policy_denied` and one `diagnostics` entry per violation (D4, D7, D19, D21). | Same mapper as the other HTTP errors; project `query.Violation` onto `Diagnostic` with `provider: gatekeeper`. | 3 |
| Correctly classified parse errors still lack `reason` | Under validation a syntax error is `bad_request` on every transport, so these cases passed before D19; the frames have no `reason`. | `sql_parse_error` (D19). | Covered by the `reason` fix in go.yaml. | 4 |
| JSON keys match case-insensitively | As in go.yaml, but here the shadowed `exec` is refused by validation, so the response is a 400 instead of an empty body. | Protocol fields decoded exactly; application fields must not shadow them (D9). | Decode protocol fields with a strict decoder or reject case-variant duplicates. | 1 |

<details><summary>Baselined violations by case</summary>

- **Disabled `exec` is `bad_request`**
  - `post/exec-unsupported`: `error.content-type`, `error.not-json`
  - `ws/exec-unsupported`: `error.code.bad_request`, `error.schema.required.reason`, `error.reason.missing`
- **Gatekeeper rejections are `forbidden` or `bad_request` regardless of cause**
  - `rest/ws-sql-error-stays-open`: `s1.error.status.400`, `s1.error.code.missing`, `s1.error.reason.missing`
  - `post/arrow-multi-statement`: `error.status.403`, `error.content-type`, `error.not-json`
  - `ws/arrow-multi-statement`: `error.code.forbidden`, `error.schema.required.reason`, `error.reason.missing`
  - `post/sql-unknown-table`: `error.status.400`, `error.content-type`, `error.not-json`
  - `ws/sql-unknown-table`: `error.code.bad_request`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-sql-error-stays-open`: `s1.error.code.bad_request`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
  - `get/arrow-multi-statement`: `error.status.403`, `error.content-type`, `error.not-json`
- **Parse error body is `Bad Request`**
  - `post/sql-parse-error`: `error.content-type`, `error.not-json`
- **Default policy denies `information_schema`**
  - `get/get-ddl-rejected`: `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.status.403`
  - `get/get-exec-rejected`: `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.status.403`
- **Policy denials are plain text over HTTP and carry no `reason` or diagnostics**
  - `get/policy-denied-file`: `error.content-type`, `error.not-json`
  - `post/policy-denied-file`: `error.content-type`, `error.not-json`
  - `ws/policy-denied-file`: `error.schema.required.reason`, `error.reason.missing`
- **Correctly classified parse errors still lack `reason`**
  - `rest/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `rest/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
  - `ws/sql-parse-error`: `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-pipeline-order`: `s2.error.schema.required.reason`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.schema.required.reason`, `s4.error.reason.missing`
- **JSON keys match case-insensitively**
  - `post/protocol-fields-not-shadowed`: `arrow.status.400`

</details>

## Rust `duckdb-server`

Configuration: `duckdb-server` crate (`packages/server/duckdb-server-rust`). Transports: post, get, ws; smoke cases over rest, socket.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| Arrow IPC file format | `FileWriter` output (`ARROW1` magic plus footer) under the stream media type (`db.rs`, `interfaces.rs`). | IPC stream format (D8). | Use `StreamWriter`; update the `test.rs` assertion. Row contents are still compared, so this only hides framing. | 29 |
| HTTP errors are plain text or empty | Rejections are serde/axum text (`interfaces.rs`); DuckDB errors are `Something went wrong: …`; 405 and 415 have plain or empty bodies. | JSON `Error` envelope on every status (D4, D5). | Custom rejection handlers and a shared error mapper. | 12 |
| WebSocket errors lack `code` and `reason` | `{"error"}` only (`websocket.rs`); the message also differs from HTTP. | Envelope with `code` and `reason`, identical over both transports (D4, D19). | Shared mapper. | 13 |
| Unknown `type` is 422 | serde enum rejection surfaces as axum's 422 `Failed to deserialize the JSON body`. | 400 `bad_request` (D6). | Decode `type` as a string and match manually. | 1 |
| `preagg` is unknown | Same 422 path as any unknown variant. | `unsupported_command` (D6). | Add the variant and answer `unsupported_command` until implemented. | 1 |
| Parse errors and empty `sql` are 500 | Every `duckdb::Error` is `Something went wrong` with 500; an empty string yields `Error code 1: Unknown error code`. | `bad_request` for parse errors and empty SQL (D1, D7). | Validate `sql`; map `duckdb::Error` variants to codes. | 4 |
| Exec and side effects over GET | `handle_get` runs any `type` and does not check the statement kind; the follow-up probes confirm the table was created and the row deleted. | `arrow` only (D3); read-only root required (D3a). | Reject `exec` in `handle_get`; check the statement type before execution. | 3 |
| Multi-statement `arrow` | Runs and returns a result rather than rejecting. | `bad_request` (D16). | Count statements before execution. | 3 |
| HEAD runs the query | axum's GET route also serves HEAD, so `HEAD /?type=arrow&sql=…` executes and returns 200. | 405 with `Allow` (D5). | Add an explicit fallback for other methods. | 1 |
| WebSocket binary frames are ignored | `Message::Binary` is dropped with no reply (`websocket.rs`). | SHOULD accept; MUST reply (D11). | Treat as text or answer with `bad_request`. | 1 |
| Client connectors expose no error code | `restConnector` rejects with `Error('Query failed with HTTP status …')` and `socketConnector` with the frame's `error` string, so the coordinator sees no `code`, `reason`, or `field`. | Rejections carry the envelope's `code`, `reason`, and `field` as structured properties (D19, D24). | #1224 adds `ConnectorError` with `code`, `status`, and `reference`; `reason` and `field` need a follow-up there. Over HTTP the code also depends on this server emitting the JSON envelope. | 6 |
| Malformed upgrade falls through to GET | A bad upgrade request reaches the GET handler (`app.rs`). | 400 envelope. | Return the upgrade rejection. | not observable |
| README GET example | `?query={…}` is documented but the code reads flat parameters. | Flat parameters (D2). | Fix the README. | not observable |
| CORS and caching headers | No `Access-Control-Expose-Headers`; no cache headers. | Expose `ETag`; caching optional (D14). | Edit `CorsLayer`; add cache headers if wanted. | not observable |
| Timeouts | None; DuckDB calls block tokio workers (`db.rs`). | `deadline_exceeded`. | `spawn_blocking` plus `duckdb_interrupt`. | not observable |
| Large GET query strings are rejected | hyper rejects a 1 MiB request line with 431. | Servers SHOULD accept at least 1 MiB (D13). | Raise `http1_max_buf_size`, or document the limit. | 1 |

<details><summary>Baselined violations by case</summary>

- **Arrow IPC file format**
  - `get/get-arrow`: `arrow.file-format`
  - `get/get-plus-in-sql`: `arrow.file-format`
  - `get/get-cte-allowed`: `arrow.file-format`
  - `get/get-set-operation-allowed`: `arrow.file-format`
  - `post/arrow-stream-format`: `arrow.file-format`
  - `post/arrow-empty-result`: `arrow.file-format`
  - `post/arrow-scalar-types`: `arrow.file-format`
  - `post/arrow-many-rows`: `arrow.file-format`
  - `post/arrow-from-parquet`: `arrow.file-format`
  - `post/arrow-trailing-semicolon`: `arrow.file-format`
  - `post/application-fields-pass-through`: `arrow.file-format`
  - `post/protocol-fields-not-shadowed`: `arrow.file-format`
  - `post/content-type-with-charset`: `arrow.file-format`
  - `post/arrow-cors-origin`: `arrow.file-format`
  - `post/large-request-1mib`: `arrow.file-format`
  - `post/exec-acknowledged`: `s2.arrow.file-format`
  - `post/exec-multi-statement`: `s2.arrow.file-format`
  - `ws/arrow-stream-format`: `arrow.file-format`
  - `ws/arrow-empty-result`: `arrow.file-format`
  - `ws/arrow-scalar-types`: `arrow.file-format`
  - `ws/arrow-many-rows`: `arrow.file-format`
  - `ws/arrow-trailing-semicolon`: `arrow.file-format`
  - `ws/application-fields-pass-through`: `arrow.file-format`
  - `ws/protocol-fields-not-shadowed`: `arrow.file-format`
  - `ws/large-request-1mib`: `arrow.file-format`
  - `ws/exec-acknowledged`: `s2.arrow.file-format`
  - `ws/exec-multi-statement`: `s2.arrow.file-format`
  - `ws/ws-pipeline-order`: `s1.arrow.file-format`, `s2.error.schema.required.code`, `s2.error.code.missing`, `s3.arrow.file-format`, `s4.error.schema.required.code`, `s4.error.code.missing`, `s5.arrow.file-format`, `s2.error.schema.required.reason`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.schema.required.reason`, `s4.error.reason.missing`
  - `ws/ws-pipeline-slow-first`: `s1.arrow.file-format`, `s2.arrow.file-format`
- **HTTP errors are plain text or empty**
  - `post/missing-type`: `error.content-type`, `error.not-json`
  - `post/missing-sql`: `error.content-type`, `error.not-json`
  - `post/type-not-a-string`: `error.content-type`, `error.not-json`
  - `post/malformed-json-body`: `error.content-type`, `error.not-json`
  - `post/sql-unknown-table`: `error.content-type`, `error.not-json`
  - `post/sql-runtime-error`: `error.content-type`, `error.not-json`
  - `post/exec-error`: `error.content-type`, `error.not-json`
  - `post/content-type-not-json`: `alt1.error.content-type`, `alt1.error.not-json`
  - `post/method-put`: `error.content-type`, `error.not-json`
  - `get/get-missing-type`: `error.content-type`, `error.not-json`
  - `get/get-json-wrapped-query-rejected`: `error.content-type`, `error.not-json`
  - `get/get-preagg-rejected`: `error.content-type`, `error.not-json`
- **WebSocket errors lack `code` and `reason`**
  - `ws/missing-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/missing-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/empty-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/unknown-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/type-not-a-string`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/preagg-unsupported`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-parse-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-unknown-table`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-runtime-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/exec-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-malformed-json-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.file-format`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
  - `ws/ws-missing-sql-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.file-format`, `s1.error.schema.required.reason`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `ws/ws-sql-error-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.file-format`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
- **Unknown `type` is 422**
  - `post/unknown-type`: `error.status.422`, `error.content-type`, `error.not-json`
- **`preagg` is unknown**
  - `post/preagg-unsupported`: `error.status.422`, `error.content-type`, `error.not-json`
- **Parse errors and empty `sql` are 500**
  - `rest/sql-parse-error`: `error.status.500`
  - `rest/ws-pipeline-order`: `s4.error.status.500`
  - `post/sql-parse-error`: `error.status.500`, `error.content-type`, `error.not-json`
  - `post/empty-sql`: `error.status.500`, `error.content-type`, `error.not-json`
- **Exec and side effects over GET**
  - `get/get-exec-rejected`: `s1.error.status.200`, `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.file-format`, `s2.arrow.rows`
  - `get/get-ddl-rejected`: `s1.error.status.200`, `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.file-format`, `s2.arrow.rows`
  - `get/get-delete-returning-rejected`: `s2.error.status.200`, `s2.error.content-type`, `s2.error.not-json`, `s3.arrow.file-format`, `s3.arrow.rows`
- **Multi-statement `arrow`**
  - `post/arrow-multi-statement`: `error.status.200`, `error.content-type`, `error.not-json`
  - `ws/arrow-multi-statement`: `error.frame`
  - `get/arrow-multi-statement`: `error.status.200`, `error.content-type`, `error.not-json`
- **HEAD runs the query**
  - `post/method-head`: `status.200`, `header.allow`
- **WebSocket binary frames are ignored**
  - `ws/ws-binary-frame`: `alt0.ws.no-reply`
- **Client connectors expose no error code**
  - `rest/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `rest/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `socket/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `rest/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
  - `socket/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
- **Large GET query strings are rejected**
  - `get/large-request-1mib`: `arrow.status.431`

</details>

## Python `duckdb-server`

Configuration: `duckdb-server` (`packages/server/duckdb-server`). Transports: post, get, ws; smoke cases over rest, socket.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| WebSocket errors lack `code` and `reason` | `{"error": str(e)}` only (`SocketHandler.error`); msgspec's decode message is the only classification. | Envelope with `code`, `reason`, and `field` (D4, D19). | Share an error mapper with the HTTP handler; map msgspec `ValidationError` to `missing_field`/`invalid_field` with the field name. | 13 |
| HTTP errors are plain text | `handler.error()` ends the response with `str(error)` and no Content-Type. | JSON `Error` envelope (D4, D19). | Emit `{error, code, reason}` with `application/json`. | 8 |
| Empty `sql` | `msgspec` accepts `""`, then `get_arrow_bytes` fails on a `None` result (500). | 400 `bad_request` (D1). | Add `min_length=1` to the struct or validate before dispatch. | 1 |
| Parse errors are 500 | Every DuckDB exception is `handler.error(e)` with the default 500. | `bad_request` for `duckdb.ParserException` (D7). | Map exception classes to codes. | 3 |
| `preagg` is unknown | `msgspec` rejects it as an invalid enum value. | `unsupported_command` (D6). | Accept the literal and answer `unsupported_command` until implemented. | 1 |
| GET reads `?query=<json>` | The flat form is rejected with `missing required 'query' parameter`; the JSON form runs `exec`. | Flat `type`/`sql`, `arrow` only, read-only SQL (D2, D3, D3a). | Read flat parameters; reject `exec`/`preagg`; check the statement kind with `duckdb.extract_statements()`. | 11 |
| Multi-statement `arrow` | All statements run and the last result is returned. | `bad_request` (D16). | Count statements with `duckdb.extract_statements()`. | 3 |
| Unsupported method is 400 | `Unsupported HTTP method` with status 400 and no `Allow`. | 405 with `Allow` and the envelope (D5). | Change the status and add the header. | 2 |
| Client connectors expose no error code | `restConnector` rejects with `Error('Query failed with HTTP status …')` and `socketConnector` with the frame's `error` string, so the coordinator sees no `code`, `reason`, or `field`. | Rejections carry the envelope's `code`, `reason`, and `field` as structured properties (D19, D24). | #1224 adds `ConnectorError` with `code`, `status`, and `reference`; `reason` and `field` need a follow-up there. Over HTTP the code also depends on this server emitting the JSON envelope. | 6 |
| CORS | `Access-Control-Request-Method` is emitted as a response header; no `Access-Control-Expose-Headers`. | Drop the request header; expose `ETag` if caching is ever added. | Edit `CORS_HEADERS`. | not observable |
| Concurrency | A synchronous handler blocks the event loop for every connection. | No wire requirement; prerequisite for deadlines. | Run queries in a thread pool. | not observable |
| Large GET request lines reset the connection | uWebSockets answers a request line over its header buffer with a 505 and closes; the client sees the 505, a write error (`ECONNRESET` on macOS, `EPIPE` on Linux), or the close while reading the 505 body, depending on which lands first. | Servers SHOULD accept at least 1 MiB (D13); a rejection should be a consistent HTTP status. | Probably not configurable in socketify; document the limit. | 1 |

<details><summary>Baselined violations by case</summary>

- **WebSocket errors lack `code` and `reason`**
  - `ws/missing-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/missing-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/empty-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/unknown-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/type-not-a-string`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/preagg-unsupported`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-parse-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-unknown-table`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-runtime-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/exec-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-malformed-json-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
  - `ws/ws-missing-sql-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s1.error.schema.required.reason`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `ws/ws-sql-error-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
- **HTTP errors are plain text**
  - `post/missing-type`: `error.content-type`, `error.not-json`
  - `post/missing-sql`: `error.content-type`, `error.not-json`
  - `post/unknown-type`: `error.content-type`, `error.not-json`
  - `post/type-not-a-string`: `error.content-type`, `error.not-json`
  - `post/malformed-json-body`: `error.content-type`, `error.not-json`
  - `post/sql-unknown-table`: `error.content-type`, `error.not-json`
  - `post/sql-runtime-error`: `error.content-type`, `error.not-json`
  - `post/exec-error`: `error.content-type`, `error.not-json`
- **Empty `sql`**
  - `post/empty-sql`: `error.status.500`, `error.content-type`, `error.not-json`
- **Parse errors are 500**
  - `rest/sql-parse-error`: `error.status.500`
  - `rest/ws-pipeline-order`: `s4.error.status.500`
  - `post/sql-parse-error`: `error.status.500`, `error.content-type`, `error.not-json`
- **`preagg` is unknown**
  - `post/preagg-unsupported`: `error.content-type`, `error.not-json`
- **GET reads `?query=<json>`**
  - `get/get-arrow`: `arrow.status.400`
  - `get/get-plus-in-sql`: `arrow.status.400`
  - `get/get-cte-allowed`: `arrow.status.400`
  - `get/get-set-operation-allowed`: `arrow.status.400`
  - `get/get-missing-type`: `error.content-type`, `error.not-json`
  - `get/get-json-wrapped-query-rejected`: `error.status.200`, `error.content-type`, `error.not-json`
  - `get/get-exec-rejected`: `s1.error.content-type`, `s1.error.not-json`
  - `get/get-preagg-rejected`: `error.content-type`, `error.not-json`
  - `get/get-ddl-rejected`: `s1.error.content-type`, `s1.error.not-json`
  - `get/get-delete-returning-rejected`: `s2.error.content-type`, `s2.error.not-json`
  - `get/arrow-multi-statement`: `error.content-type`, `error.not-json`
- **Multi-statement `arrow`**
  - `post/arrow-multi-statement`: `error.status.200`, `error.content-type`, `error.not-json`
  - `ws/arrow-multi-statement`: `error.frame`
  - `ws/ws-pipeline-order`: `s2.error.schema.required.code`, `s2.error.code.missing`, `s4.error.schema.required.code`, `s4.error.code.missing`, `s2.error.schema.required.reason`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.schema.required.reason`, `s4.error.reason.missing`
- **Unsupported method is 400**
  - `post/method-put`: `error.status.400`, `error.content-type`, `error.not-json`, `header.allow`
  - `post/method-head`: `status.400`, `header.allow`
- **Client connectors expose no error code**
  - `rest/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `rest/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `socket/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `rest/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
  - `socket/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
- **Large GET request lines reset the connection**
  - `get/large-request-1mib`: `http.reset.peer-closed|arrow.status.505|http.reset.after-505.socket-closed`

</details>

## Node `@uwdata/mosaic-duckdb`

Configuration: `@uwdata/mosaic-duckdb` data server (`packages/server/duckdb`). Transports: post, get, ws; smoke cases over rest, socket.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| HTTP errors are plain text | `res.error()` writes `String(err)` with no Content-Type (`data-server.js`). | JSON `Error` envelope with `application/json` on every failure (D4, D19). | Rewrite `error()` to emit `{error, code, reason}`. | 7 |
| WebSocket errors lack `code` and `reason` | `{"error": String(err)}` with an `Error:` prefix; the status argument is dropped (`data-server.js`). | Envelope with `code` and `reason` (D4, D19). | Share the HTTP error mapper. | 9 |
| `sql` is not validated | A missing or empty `sql` reaches DuckDB and fails as a binder or parser error (500). | 400 `bad_request` / `missing_field` or `invalid_field` with `field: sql` (D1, D19). | Validate before dispatch. | 5 |
| Parse errors are 500 | DuckDB parser errors surface as `internal_error`. | `bad_request` (D7). | Classify `Parser Error` before falling through to 500. | 4 |
| `preagg` is unknown | `Unrecognized command: preagg` as a generic bad request. | `unsupported_command` (D6). | Recognise the command and answer `unsupported_command` until implemented. | 2 |
| GET is broken | `JSON.parse` is applied to the already-parsed query object, so every GET is a 400 `TypeError` (`data-server.js`). | Flat `type`/`sql` parameters, `arrow` only, read-only SQL (D2, D3, D3a). | Build the command from `url.query`; reject `exec`/`preagg`; check the statement kind with `json_serialize_sql`. | 11 |
| Empty Arrow result is 0 bytes | `DuckDB.js` returns no bytes for zero rows; `duckdb.test.js` asserts it. | Schema message plus end-of-stream marker (D8). | Emit a schema-only stream. | 2 |
| Trailing `;` and multi-statement `arrow` | SQL is wrapped as `to_arrow_ipc((sql))`, so a trailing `;` is a parser error (500) and several statements fail the same way. | Trailing `;` allowed; several statements are `bad_request` (D16). | Strip a trailing `;`; count statements before wrapping. | 4 |
| Unsupported method is 400 | `Unsupported HTTP method` with status 400 and no `Allow`. | 405 with `Allow: GET, POST, OPTIONS` and the envelope (D5). | Change the status and add the header. | 2 |
| Client connectors expose no error code | `restConnector` rejects with `Error('Query failed with HTTP status …')` and `socketConnector` with the frame's `error` string, so the coordinator sees no `code`, `reason`, or `field`. | Rejections carry the envelope's `code`, `reason`, and `field` as structured properties (D19, D24). | #1224 adds `ConnectorError` with `code`, `status`, and `reference`; `reason` and `field` need a follow-up there. Over HTTP the code also depends on this server emitting the JSON envelope. | 6 |
| Shared DuckDB connection | One connection serves every client (`DuckDB.js`). | No requirement. | Note only. | not observable |
| Arrow stream lacks the end-of-stream marker | `DuckDB.js` concatenates the record batches and stops; there is no trailing 0-length message, so a reader that waits for EOS never finishes. | Schema, batches, then the end-of-stream marker (D8). | Append `ff ff ff ff 00 00 00 00`, or let `to_arrow_ipc` emit the full stream. | 22 |
| Large GET query strings are rejected | Node's HTTP parser limits the request line and headers to 16 KiB (`maxHeaderSize`), so a 1 MiB query string is a 431. | Servers SHOULD accept at least 1 MiB (D13). | Pass `maxHeaderSize` to `http.createServer`, or document the limit. | 1 |

<details><summary>Baselined violations by case</summary>

- **HTTP errors are plain text**
  - `post/missing-type`: `error.content-type`, `error.not-json`
  - `post/unknown-type`: `error.content-type`, `error.not-json`
  - `post/type-not-a-string`: `error.content-type`, `error.not-json`
  - `post/malformed-json-body`: `error.content-type`, `error.not-json`
  - `post/sql-unknown-table`: `error.content-type`, `error.not-json`
  - `post/sql-runtime-error`: `error.content-type`, `error.not-json`
  - `post/exec-error`: `error.content-type`, `error.not-json`
- **WebSocket errors lack `code` and `reason`**
  - `ws/missing-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/unknown-type`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/type-not-a-string`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/sql-unknown-table`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/sql-runtime-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/exec-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
  - `ws/ws-malformed-json-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.eos`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
  - `ws/ws-sql-error-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.eos`, `s1.error.schema.required.reason`, `s1.error.reason.missing`
  - `ws/ws-pipeline-order`: `s1.arrow.eos`, `s2.error.schema.required.code`, `s2.error.code.missing`, `s3.arrow.eos`, `s4.error.schema.required.code`, `s4.error.code.missing`, `s5.arrow.eos`, `s2.error.schema.required.reason`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.schema.required.reason`, `s4.error.reason.missing`
- **`sql` is not validated**
  - `post/missing-sql`: `error.status.500`, `error.content-type`, `error.not-json`
  - `post/empty-sql`: `error.status.500`, `error.content-type`, `error.not-json`
  - `ws/missing-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/empty-sql`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`, `error.field.missing`
  - `ws/ws-missing-sql-stays-open`: `s1.error.schema.required.code`, `s1.error.code.missing`, `s2.arrow.eos`, `s1.error.schema.required.reason`, `s1.error.reason.missing`, `s1.error.field.missing`
- **Parse errors are 500**
  - `rest/sql-parse-error`: `error.status.500`
  - `rest/ws-pipeline-order`: `s4.error.status.500`
  - `post/sql-parse-error`: `error.status.500`, `error.content-type`, `error.not-json`
  - `ws/sql-parse-error`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
- **`preagg` is unknown**
  - `post/preagg-unsupported`: `error.content-type`, `error.not-json`
  - `ws/preagg-unsupported`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
- **GET is broken**
  - `get/get-arrow`: `arrow.status.400`
  - `get/get-plus-in-sql`: `arrow.status.400`
  - `get/get-cte-allowed`: `arrow.status.400`
  - `get/get-set-operation-allowed`: `arrow.status.400`
  - `get/get-missing-type`: `error.content-type`, `error.not-json`
  - `get/get-json-wrapped-query-rejected`: `error.content-type`, `error.not-json`
  - `get/get-exec-rejected`: `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.eos`
  - `get/get-preagg-rejected`: `error.content-type`, `error.not-json`
  - `get/get-ddl-rejected`: `s1.error.content-type`, `s1.error.not-json`, `s2.arrow.eos`
  - `get/get-delete-returning-rejected`: `s2.error.content-type`, `s2.error.not-json`, `s3.arrow.eos`
  - `get/arrow-multi-statement`: `error.content-type`, `error.not-json`
- **Empty Arrow result is 0 bytes**
  - `post/arrow-empty-result`: `arrow.empty`
  - `ws/arrow-empty-result`: `arrow.empty`
- **Trailing `;` and multi-statement `arrow`**
  - `post/arrow-trailing-semicolon`: `arrow.status.500`
  - `ws/arrow-trailing-semicolon`: `arrow.frame`
  - `post/arrow-multi-statement`: `error.status.500`, `error.content-type`, `error.not-json`
  - `ws/arrow-multi-statement`: `error.schema.required.code`, `error.code.missing`, `error.schema.required.reason`, `error.reason.missing`
- **Unsupported method is 400**
  - `post/method-put`: `error.status.400`, `error.content-type`, `error.not-json`, `header.allow`
  - `post/method-head`: `status.400`, `header.allow`
- **Client connectors expose no error code**
  - `rest/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `socket/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `rest/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `socket/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `rest/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
  - `socket/ws-pipeline-order`: `s2.error.code.missing`, `s2.error.reason.missing`, `s2.error.field.missing`, `s4.error.code.missing`, `s4.error.reason.missing`
- **Arrow stream lacks the end-of-stream marker**
  - `post/application-fields-pass-through`: `arrow.eos`
  - `post/arrow-cors-origin`: `arrow.eos`
  - `post/arrow-from-parquet`: `arrow.eos`
  - `post/arrow-many-rows`: `arrow.eos`
  - `post/arrow-scalar-types`: `arrow.eos`
  - `post/arrow-stream-format`: `arrow.eos`
  - `post/content-type-not-json`: `alt0.arrow.eos`
  - `post/content-type-with-charset`: `arrow.eos`
  - `post/exec-acknowledged`: `s2.arrow.eos`
  - `post/exec-multi-statement`: `s2.arrow.eos`
  - `post/large-request-1mib`: `arrow.eos`
  - `post/protocol-fields-not-shadowed`: `arrow.eos`
  - `ws/application-fields-pass-through`: `arrow.eos`
  - `ws/arrow-many-rows`: `arrow.eos`
  - `ws/arrow-scalar-types`: `arrow.eos`
  - `ws/arrow-stream-format`: `arrow.eos`
  - `ws/exec-acknowledged`: `s2.arrow.eos`
  - `ws/exec-multi-statement`: `s2.arrow.eos`
  - `ws/large-request-1mib`: `arrow.eos`
  - `ws/protocol-fields-not-shadowed`: `arrow.eos`
  - `ws/ws-binary-frame`: `alt0.arrow.eos`
  - `ws/ws-pipeline-slow-first`: `s1.arrow.eos`, `s2.arrow.eos`
- **Large GET query strings are rejected**
  - `get/large-request-1mib`: `arrow.status.431`

</details>

## In-process `NodeConnector`

Configuration: `NodeConnector` (`@uwdata/mosaic-core/node-connector`) over an in-process `@uwdata/mosaic-duckdb` database. Transports: inproc.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| `type` is not validated | Anything other than `exec` runs as `arrow` (`NodeConnector.ts`), so a missing, unknown, or non-string `type`, and `preagg`, run the SQL and resolve a result. | `missing_field`/`invalid_field` for a bad `type`; `unsupported_command` for `preagg` until implemented (D1, D6, D24). | Check `type` before dispatch and reject with a `ConnectorError`. | 5 |
| Rejections carry no code | DuckDB errors from `@duckdb/node-api` are rethrown as plain `Error`s; a missing or empty `sql` reaches DuckDB and fails as a binder or parser error. | `ConnectorError` with `code`, `reason`, and `field` (D19, D24). | Map engine exceptions to codes in the connector; validate `sql` before dispatch. #1224 adds the error type without `reason`/`field`. | 10 |
| `exec` resolves the database | `DuckDB.exec` returns `this`, and the connector passes it through despite the `Promise<void>` signature. | `exec` resolves `undefined` (D24). | Return nothing from the `exec` branch. | 2 |
| Zero rows and a trailing semicolon go through `to_arrow_ipc` | `arrowBuffer` wraps the SQL as `to_arrow_ipc((sql))`, so a trailing `;` is a parse error and a zero-row result yields `[]`, which does not decode to a table. | Trailing `;` allowed (D16); a zero-row result decodes with its schema (D24). | Strip a trailing `;`; emit a schema-only stream for zero rows, as the Node server also needs (D8). | 2 |

<details><summary>Baselined violations by case</summary>

- **`type` is not validated**
  - `inproc/missing-type`: `error.resolved`
  - `inproc/unknown-type`: `error.resolved`
  - `inproc/type-not-a-string`: `error.resolved`
  - `inproc/preagg-unsupported`: `error.resolved`
  - `inproc/ws-pipeline-order`: `s2.error.resolved`
- **Rejections carry no code**
  - `inproc/missing-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `inproc/empty-sql`: `error.code.missing`, `error.reason.missing`, `error.field.missing`
  - `inproc/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/sql-unknown-table`: `error.code.missing`, `error.reason.missing`
  - `inproc/sql-runtime-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/exec-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/arrow-multi-statement`: `error.code.missing`, `error.reason.missing`
  - `inproc/ws-missing-sql-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`, `s1.error.field.missing`
  - `inproc/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `inproc/ws-pipeline-order`: `s4.error.code.missing`, `s4.error.reason.missing`
- **`exec` resolves the database**
  - `inproc/exec-acknowledged`: `s1.exec.result`
  - `inproc/exec-multi-statement`: `s1.exec.result`
- **Zero rows and a trailing semicolon go through `to_arrow_ipc`**
  - `inproc/arrow-trailing-semicolon`: `arrow.rejected`
  - `inproc/arrow-empty-result`: `arrow.decode`

</details>

## In-process `DuckDBWASMConnector`

Configuration: `DuckDBWASMConnector` (`packages/mosaic/core/src/connectors/wasm.ts`) on the duckdb-wasm Node bundle in a worker thread, with `data/*.parquet` registered in its virtual file system. Transports: inproc.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| `type` and `sql` are not validated | Every request runs `runQuery(conn, sql)` and only `exec` is special-cased (`wasm.ts`), so a missing, unknown, or non-string `type` and `preagg` run the SQL, and a missing or empty `sql` resolves with an empty result instead of rejecting. | `missing_field`/`invalid_field` for a bad `type` or `sql`; `unsupported_command` for `preagg` until implemented (D1, D6, D24). | Check `type` and `sql` before dispatch and reject with a `ConnectorError`. | 8 |
| Rejections carry no code | duckdb-wasm rebuilds the worker's exception as an `Error` whose `name` is the DuckDB exception class; the connector rethrows it unchanged. | `ConnectorError` with `code`, `reason`, and `field` (D19, D24). | Map exception names (`Parser Error`, `Catalog Error`, …) to codes in the connector. #1224 adds the error type without `reason`/`field`. | 6 |
| Multi-statement `arrow` returns the first statement | `runQuery` runs every statement and returns the first result set; `SELECT 1 AS x; SELECT 2 AS y` resolves with `x`. | `bad_request` / `multiple_statements` (D16). | Count statements before execution. | 1 |
| Results are IPC file format | `runQuery` returns the IPC file encoding (`ARROW1` magic); Flechette decodes it, so the coordinator is unaffected. | Not a command-layer requirement (D24); recorded so the difference from the wire rule (D8) is visible. | None required. | not observable |

<details><summary>Baselined violations by case</summary>

- **`type` and `sql` are not validated**
  - `inproc/missing-type`: `error.resolved`
  - `inproc/unknown-type`: `error.resolved`
  - `inproc/type-not-a-string`: `error.resolved`
  - `inproc/preagg-unsupported`: `error.resolved`
  - `inproc/missing-sql`: `error.resolved`
  - `inproc/empty-sql`: `error.resolved`
  - `inproc/ws-missing-sql-stays-open`: `s1.error.resolved`
  - `inproc/ws-pipeline-order`: `s2.error.resolved`
- **Rejections carry no code**
  - `inproc/sql-parse-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/sql-unknown-table`: `error.code.missing`, `error.reason.missing`
  - `inproc/sql-runtime-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/exec-error`: `error.code.missing`, `error.reason.missing`
  - `inproc/ws-sql-error-stays-open`: `s1.error.code.missing`, `s1.error.reason.missing`
  - `inproc/ws-pipeline-order`: `s4.error.code.missing`, `s4.error.reason.missing`
- **Multi-statement `arrow` returns the first statement**
  - `inproc/arrow-multi-statement`: `error.resolved`

</details>

## Python widget (Jupyter comm)

Configuration: `MosaicWidget._handle_custom_msg` (`packages/vgplot/widget/mosaic_widget/__init__.py`), driven over stdio by `packages/vgplot/widget/conformance/shim.py`; this exercises the Python callback boundary, not Jupyter message scheduling. Transports: comm.

| Area | Current | Spec | Fix | Cases |
|------|---------|------|-----|-------|
| A malformed message gets no reply | `content["uuid"]`, `content["sql"]`, and `content["type"]` are read before the `try` (`__init__.py:139-143`), so a message missing any of them raises `KeyError` out of the handler and nothing is sent; the JS side's promise never settles. | Exactly one reply per message: an `error` reply with `missing_field` and the field name, uncorrelated (`uuid: null`) when the uuid itself is missing (D25). | Move the reads inside the `try`, validate `uuid` first, and reply `{type: error, uuid: <uuid or null>, error: {...}}`. | 6 |
| An invalid `uuid` is echoed and the command still runs | `uuid` is passed through unchecked: an empty string or a number is echoed on a normal `arrow`/`exec` reply, and the SQL executes; the follow-up probe finds the table the rejected `exec` should not have created. | Validate `uuid` before executing; empty or non-string is `invalid_field` with `uuid: null` and nothing runs (D25). | Check `isinstance(uuid, str) and uuid` before dispatch. | 2 |
| Errors are a bare string | Failures reply `{error: str(e), uuid}`: no `type: error` framing, and the payload is the message text rather than the `Error` envelope, so there is no `code`, `reason`, or `field`. An unknown `type` and `preagg` fall into the same path. | `{type: error, uuid, error: Error}` with the envelope's classification (D19, D26); `preagg` is `unsupported_command` / `command_disabled` until implemented. | Map exceptions to codes and wrap them in the envelope; recognise `preagg`. | 11 |
| Multi-statement `arrow` | `con.query(sql)` runs every statement and a result is returned. | `bad_request` / `multiple_statements` (D16). | Count statements with `duckdb.extract_statements()` before running. | 1 |
| JS handler | `src/index.js` treats `error: ""` as success, throws on a reply whose `uuid` it does not know, and rejects with a raw string. | Log and drop uncorrelated or unknown replies; reject with a structured error (D25, D26). | Guard `openQueries.get`, check `typeof msg.error === 'object'`, build a `ConnectorError`. Not reachable from this target; needs a fake-model unit test in the widget package. | not observable |

<details><summary>Baselined violations by case</summary>

- **A malformed message gets no reply**
  - `comm/comm-missing-uuid`: `comm.no-reply`
  - `comm/missing-sql`: `comm.no-reply`
  - `comm/missing-type`: `comm.no-reply`
  - `comm/ws-missing-sql-stays-open`: `s1.comm.no-reply`
  - `comm/comm-pipeline-association`: `s2.comm.no-reply`
  - `comm/ws-pipeline-order`: `s2.comm.no-reply`
- **An invalid `uuid` is echoed and the command still runs**
  - `comm/comm-empty-uuid`: `comm.reply.type.arrow`, `comm.uuid.not-null`, `comm.buffers.1`, `comm.error.not-object`
  - `comm/comm-invalid-uuid-not-executed`: `s1.comm.reply.type.exec`, `s1.comm.uuid.not-null`, `s1.comm.error.not-object`, `s2.arrow.rows`
- **Errors are a bare string**
  - `comm/empty-sql`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/unknown-type`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/type-not-a-string`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/preagg-unsupported`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/sql-parse-error`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/sql-unknown-table`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/sql-runtime-error`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/exec-error`: `comm.reply.type.missing`, `comm.error.not-object`
  - `comm/ws-sql-error-stays-open`: `s1.comm.reply.type.missing`, `s1.comm.error.not-object`
  - `comm/ws-pipeline-order`: `s4.comm.reply.type.missing`, `s4.comm.error.not-object`
  - `comm/comm-pipeline-association`: `s4.comm.reply.type.missing`, `s4.comm.error.not-object`
- **Multi-statement `arrow`**
  - `comm/arrow-multi-statement`: `comm.reply.type.arrow`, `comm.buffers.1`, `comm.error.not-object`

</details>

<!-- conformance:end -->
