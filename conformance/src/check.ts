import { arrowViolations } from './arrow.ts';
import { substitute } from './cases.ts';
import { schemaViolations } from './schema.ts';
import { canonicalStatus, type CommResponse, type CommTimeout, type ConnectorResponse, type ErrorExpectation, type Expectation, type Matcher, type Response, type TableReference, type Transport, type Violation, type WsResponse } from './types.ts';

const arrowMediaType = 'application/vnd.apache.arrow.stream';
const textDecoder = new TextDecoder();

function v(id: string, detail: string): Violation {
  return { id, detail };
}

// Every expectation mismatch becomes a Violation with a stable id, so the
// known-failures baseline can name exactly which checks a server fails and
// any other mismatch on the same response is a regression.
export function checkResponse(
  expectation: Expectation,
  response: Response,
  transport: Transport,
  vars: Record<string, string>,
  sql?: string
): Violation[] {
  if (expectation.oneOf) {
    const attempts = expectation.oneOf.map(e => checkResponse(e, response, transport, vars, sql));
    if (attempts.some(a => a.length === 0)) return [];
    // A wrong status or frame kind means the alternative did not apply at
    // all, so it outweighs any number of shape problems when picking the
    // alternative to report against.
    const cost = (a: Violation[]) => a.reduce((n, x) => n + (/\.status\.|\.frame$|^ws\./.test(x.id) ? 10 : 1), 0);
    let best = 0;
    attempts.forEach((a, i) => { if (cost(a) < cost(attempts[best])) best = i; });
    return attempts[best].map(x => v(`alt${best}.${x.id}`, `[alternative ${best}] ${x.detail}`));
  }

  if (response.kind === 'http-failed') {
    return response.status === undefined
      ? [v(`http.reset.${response.reset}`, `server closed the connection without an HTTP response: ${response.error}`)]
      : [v(`http.reset.after-${response.status}.${response.reset}`, `server closed the connection while sending the ${response.status} body: ${response.error}`)];
  }
  if (response.kind === 'ws' && response.frame === 'close') {
    return [v(`ws.closed.${response.closeCode ?? 'unknown'}`, `connection closed (code ${response.closeCode}${response.closeReason ? `, ${response.closeReason}` : ''}) instead of answering`)];
  }
  if (response.kind === 'ws' && response.frame === 'timeout') {
    return [v('ws.no-reply', 'no response frame received before the timeout')];
  }
  if (response.kind === 'connector' || response.kind === 'connector-rejected' || response.kind === 'connector-timeout') {
    return checkConnectorResponse(expectation, response, sql);
  }
  if (response.kind === 'comm' || response.kind === 'comm-timeout') {
    return checkCommResponse(expectation, response, sql);
  }

  const out: Violation[] = [];

  if (expectation.arrow) {
    if (response.kind === 'http') {
      if (response.status !== 200) {
        out.push(v(`arrow.status.${response.status}`, `status ${response.status} != 200; body ${describeBody(response.body)}`));
      } else {
        const type = response.headers.get('content-type') ?? '';
        if (!type.startsWith(arrowMediaType)) out.push(v('arrow.content-type', `content-type ${JSON.stringify(type)} != ${arrowMediaType}`));
        out.push(...arrowViolations(response.body, expectation.arrow));
      }
    } else if (response.frame !== 'binary') {
      out.push(v('arrow.frame', `expected a binary Arrow frame, got text frame ${describeText(response.text)}`));
    } else {
      out.push(...arrowViolations(response.body, expectation.arrow));
    }
  }

  if (expectation.exec) {
    if (response.kind === 'http') {
      if (response.status !== 200) out.push(v(`exec.status.${response.status}`, `status ${response.status} != 200; body ${describeBody(response.body)}`));
      else if (response.body.length !== 0) out.push(v('exec.body', `exec body should be empty, got ${describeBody(response.body)}`));
    } else if (response.frame !== 'text') {
      out.push(v('exec.frame', 'expected a text frame `{}` for exec, got a binary frame'));
    } else {
      const parsed = parseJson(response.text!);
      if (parsed === undefined) out.push(v('exec.ack.not-json', `exec acknowledgement is not JSON: ${describeText(response.text)}`));
      else out.push(...schemaViolations('exec.ack', 'ExecResponse', parsed));
    }
  }

  if (expectation.json) {
    const text = response.kind === 'http' ? textDecoder.decode(response.body) : response.text;
    let inspect = true;
    if (response.kind === 'http') {
      if (response.status !== 200) {
        out.push(v(`json.status.${response.status}`, `status ${response.status} != 200; body ${describeBody(response.body)}`));
        inspect = false;
      } else if (!(response.headers.get('content-type') ?? '').startsWith('application/json')) {
        out.push(v('json.content-type', `content-type ${JSON.stringify(response.headers.get('content-type'))} is not application/json`));
      }
    } else if (response.frame !== 'text') {
      out.push(v('json.frame', 'expected a text frame, got a binary frame'));
      inspect = false;
    }
    if (inspect) {
      const parsed = text === undefined ? undefined : parseJson(text);
      if (parsed === undefined) out.push(v('json.parse', `body is not JSON: ${describeText(text)}`));
      else out.push(...schemaViolations('json.schema', expectation.json, parsed));
    }
  }

  if (expectation.error) {
    const { code } = expectation.error;
    let text: string | undefined;
    if (response.kind === 'http') {
      const status = expectation.error.status ?? canonicalStatus[code];
      if (response.status !== status) out.push(v(`error.status.${response.status}`, `status ${response.status} != ${status}; body ${describeBody(response.body)}`));
      const type = response.headers.get('content-type') ?? '';
      if (!type.startsWith('application/json')) out.push(v('error.content-type', `error content-type ${JSON.stringify(type)} is not application/json`));
      text = textDecoder.decode(response.body);
    } else if (response.frame !== 'text') {
      out.push(v('error.frame', 'expected an Error text frame, got a binary frame'));
    } else {
      text = response.text;
    }
    if (text !== undefined) {
      const parsed = parseJson(text);
      if (parsed === undefined || typeof parsed !== 'object' || parsed === null) {
        out.push(v('error.not-json', `error body is not a JSON object: ${describeText(text)}`));
      } else {
        out.push(...envelopeViolations(parsed, expectation.error, sql));
        const envelope = parsed as { diagnosticId?: unknown; retryAfterMs?: unknown };
        if (response.kind === 'http') {
          const requestId = response.headers.get('x-request-id');
          if (requestId !== null && typeof envelope.diagnosticId === 'string' && requestId !== envelope.diagnosticId) {
            out.push(v('error.diagnostic-id.mismatch', `X-Request-Id ${JSON.stringify(requestId)} != diagnosticId ${JSON.stringify(envelope.diagnosticId)}`));
          }
          const retryAfter = response.headers.get('retry-after');
          if (retryAfter !== null && typeof envelope.retryAfterMs === 'number' && Number(retryAfter) !== Math.ceil(envelope.retryAfterMs / 1000)) {
            out.push(v('error.retry-after.mismatch', `Retry-After ${JSON.stringify(retryAfter)} != ceil(${envelope.retryAfterMs} / 1000)`));
          }
        }
      }
    }
  }

  if (response.kind === 'http') {
    if (expectation.status !== undefined) {
      const accepted = Array.isArray(expectation.status) ? expectation.status : [expectation.status];
      if (!accepted.includes(response.status)) {
        out.push(v(`status.${response.status}`, `status ${response.status} not in ${JSON.stringify(accepted)}; body ${describeBody(response.body)}`));
      }
    }
    if (expectation.empty && response.body.length !== 0) {
      out.push(v('body.not-empty', `body should be empty, got ${describeBody(response.body)}`));
    }
    for (const [name, matcher] of Object.entries(expectation.headers ?? {})) {
      const problem = headerProblem(name, response.headers.get(name), matcher, vars);
      if (problem) out.push(v(`header.${name.toLowerCase()}`, problem));
    }
  } else if (expectation.status !== undefined || expectation.headers || expectation.empty) {
    throw new Error('status/headers/empty expectations only apply to HTTP transports');
  }

  return out;
}

// The error envelope check shared by every transport that carries one as
// JSON: schema, then the code, reason, and field the case names, then
// diagnostic spans.
function envelopeViolations(envelope: unknown, expected: ErrorExpectation, sql: string | undefined): Violation[] {
  const out = schemaViolations('error.schema', 'Error', envelope);
  const e = envelope as { code?: unknown; reason?: unknown; field?: unknown; diagnostics?: unknown };
  if (e.code !== expected.code) out.push(v(`error.code.${token(e.code)}`, `code ${JSON.stringify(e.code)} != ${expected.code}`));
  if (expected.reason !== undefined && e.reason !== expected.reason) out.push(v(`error.reason.${token(e.reason)}`, `reason ${JSON.stringify(e.reason)} != ${expected.reason}`));
  if (expected.field !== undefined && e.field !== expected.field) out.push(v(`error.field.${token(e.field)}`, `field ${JSON.stringify(e.field)} != ${expected.field}`));
  out.push(...locationViolations(e.diagnostics, sql));
  return out;
}

// A comm invocation is judged on what the handler sent: exactly one reply,
// echoing the request's uuid (or `null` when the request had no valid one),
// framed as `{type, uuid}` with the payload nested or in a buffer. The
// shim's own failures never reach here; they throw in CommClient.
function checkCommResponse(expectation: Expectation, response: CommResponse | CommTimeout, sql: string | undefined): Violation[] {
  if (response.kind === 'comm-timeout') {
    return [v('comm.timeout', `handler did not finish within ${response.after} ms`)];
  }
  const out: Violation[] = [];
  if (response.replies.length === 0) {
    return [v('comm.no-reply', response.raised ? `handler raised without replying: ${response.raised}` : 'handler finished without replying')];
  }
  if (response.raised) out.push(v('comm.handler-raised', `handler raised after replying: ${response.raised}`));
  if (response.replies.length > 1) out.push(v('comm.surplus-reply', `${response.replies.length} replies to one message`));
  const reply = response.replies[0];
  if (!isPlainObject(reply.content)) {
    out.push(v('comm.reply.not-object', `reply is not a JSON object: ${describeValue(reply.content)}`));
    return out;
  }
  const content = reply.content as { type?: unknown; uuid?: unknown; result?: unknown; error?: unknown };
  const expectedType = expectation.arrow ? 'arrow' : expectation.exec ? 'exec' : expectation.json ? 'preagg' : expectation.error ? 'error' : undefined;
  if (expectedType !== undefined && content.type !== expectedType) {
    out.push(v(`comm.reply.type.${token(content.type)}`, `reply type ${JSON.stringify(content.type)} != ${expectedType}`));
  }
  if (response.uuid === undefined) {
    if (content.uuid !== null) out.push(v('comm.uuid.not-null', `reply to a request without a valid uuid must carry uuid null, got ${JSON.stringify(content.uuid)}`));
  } else if (content.uuid !== response.uuid) {
    out.push(v(`comm.uuid.${content.uuid === undefined ? 'missing' : 'mismatch'}`, `reply uuid ${JSON.stringify(content.uuid)} != ${response.uuid}`));
  }
  const buffers = (n: number) => {
    if (reply.buffers.length !== n) out.push(v(`comm.buffers.${reply.buffers.length}`, `${reply.buffers.length} buffer(s) != ${n}`));
  };

  if (expectation.arrow) {
    buffers(1);
    if (content.type === 'arrow') out.push(...schemaViolations('comm.schema', 'CommArrowReply', content));
    if (reply.buffers.length >= 1) out.push(...arrowViolations(reply.buffers[0], expectation.arrow));
  }
  if (expectation.exec) {
    buffers(0);
    if (content.type === 'exec') out.push(...schemaViolations('comm.schema', 'CommExecReply', content));
  }
  if (expectation.json) {
    buffers(0);
    if (content.type === 'preagg') out.push(...schemaViolations('comm.schema', 'CommPreaggReply', content));
    if (isPlainObject(content.result)) out.push(...schemaViolations('json.schema', expectation.json, content.result));
    else out.push(v('json.not-object', `result is not an object: ${describeValue(content.result)}`));
  }
  if (expectation.error) {
    buffers(0);
    if (content.type === 'error') out.push(...schemaViolations('comm.schema', 'CommErrorReply', content, path => path.startsWith('/error')));
    if (isPlainObject(content.error)) out.push(...envelopeViolations(content.error, expectation.error, sql));
    else out.push(v('comm.error.not-object', `error payload is not an envelope object: ${describeValue(content.error)}`));
  }
  return out;
}

// The command layer sees what the coordinator sees: a resolved value or a
// rejection. Encoding is not checked here (see ArrowChecks); errors are read
// off the rejection's structured fields, so a connector that only carries a
// message records `error.code.missing`.
function checkConnectorResponse(expectation: Expectation, response: ConnectorResponse, sql: string | undefined): Violation[] {
  if (response.kind === 'connector-timeout') {
    return [v('connector.no-reply', `query neither resolved nor rejected within ${response.after} ms`)];
  }
  const out: Violation[] = [];
  const resolved = response.kind === 'connector';

  if (expectation.arrow) {
    if (!resolved) out.push(v('arrow.rejected', `query rejected instead of returning a result: ${describeError(response.error)}`));
    else {
      const bytes = ipcBytes(response.result);
      if (bytes === undefined) out.push(v('arrow.not-bytes', `result is not Arrow IPC bytes: ${describeValue(response.result)}`));
      else out.push(...arrowViolations(bytes, expectation.arrow, { framing: false }));
    }
  }

  if (expectation.exec) {
    if (!resolved) out.push(v('exec.rejected', `exec rejected: ${describeError(response.error)}`));
    else if (response.result !== undefined) out.push(v('exec.result', `exec should resolve undefined, got ${describeValue(response.result)}`));
  }

  if (expectation.json) {
    if (!resolved) out.push(v('json.rejected', `query rejected instead of returning ${expectation.json}: ${describeError(response.error)}`));
    else if (!isPlainObject(response.result)) out.push(v('json.not-object', `result is not an object: ${describeValue(response.result)}`));
    else out.push(...schemaViolations('json.schema', expectation.json, response.result));
  }

  if (expectation.error) {
    const { code, reason, field } = expectation.error;
    if (resolved) {
      out.push(v('error.resolved', `query resolved instead of rejecting with ${code}: ${describeValue(response.result)}`));
    } else {
      const err = (response.error ?? {}) as { code?: unknown; reason?: unknown; field?: unknown; status?: unknown; reference?: unknown; diagnostics?: unknown };
      if (err.code !== code) out.push(v(`error.code.${token(err.code)}`, `code ${JSON.stringify(err.code)} != ${code}: ${describeError(response.error)}`));
      if (reason !== undefined && err.reason !== reason) out.push(v(`error.reason.${token(err.reason)}`, `reason ${JSON.stringify(err.reason)} != ${reason}`));
      if (field !== undefined && err.field !== field) out.push(v(`error.field.${token(err.field)}`, `field ${JSON.stringify(err.field)} != ${field}`));
      const status = rejectionStatus(response.error);
      const expectedStatus = expectation.error.status ?? canonicalStatus[code];
      if (status !== undefined && status !== expectedStatus) out.push(v(`error.status.${status}`, `status ${status} != ${expectedStatus}`));
      if (code === 'table_not_found') {
        if (err.reference === undefined) out.push(v('error.reference.missing', 'table_not_found without a reference to rebuild'));
        else if (!isReference(err.reference)) out.push(v('error.reference.invalid', `reference is not a complete TableReference: ${JSON.stringify(err.reference)}`));
      }
      out.push(...locationViolations(err.diagnostics, sql));
    }
  }

  return out;
}

// The status comes from `ConnectorError.status` when the connector exposes
// one (#1224). The base connector on main only has it in its message, and
// that spelling is the single legacy form still parsed here; wording is
// otherwise not contractual.
export function rejectionStatus(err: unknown): number | undefined {
  const structured = (err as { status?: unknown } | null)?.status;
  if (typeof structured === 'number') return structured;
  const legacy = /^Query failed with HTTP status (\d{3})\b/.exec(err instanceof Error ? err.message : String(err));
  return legacy ? Number(legacy[1]) : undefined;
}

// `ArrowIPCBytes` is `ArrayBuffer | Uint8Array | Uint8Array[]`; chunks are
// concatenated before decoding, as the coordinator does.
export function ipcBytes(value: unknown): Uint8Array | undefined {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value) && value.every(part => part instanceof Uint8Array)) {
    const total = value.reduce((n, part) => n + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of value) { out.set(part, offset); offset += part.length; }
    return out;
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !ArrayBuffer.isView(value) && !(value instanceof ArrayBuffer);
}

function describeError(err: unknown) {
  if (err instanceof Error) return `${err.name}: ${err.message.slice(0, 160)}`;
  return describeValue(err);
}

function describeValue(value: unknown) {
  if (value === undefined) return 'undefined';
  if (value instanceof Uint8Array) return `(${value.length} bytes)`;
  if (value instanceof ArrayBuffer) return `(${value.byteLength} bytes)`;
  try {
    const text = JSON.stringify(value);
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  } catch {
    return String(value);
  }
}

export function surplusViolations(frames: WsResponse[]): Violation[] {
  if (frames.length === 0) return [];
  const kinds = frames.map(f => (f.frame === 'binary' ? `binary ${f.body?.length ?? 0} bytes` : `text ${describeText(f.text)}`));
  return [v('ws.surplus-reply', `${frames.length} unexpected frame${frames.length === 1 ? '' : 's'} after the last reply: ${kinds.join('; ')}`)];
}

// JSON Schema cannot compare sibling values, so span ordering and the bound
// against the submitted SQL are checked here. Offsets are UTF-8 bytes, so the
// bound is the encoded length, not the string length.
function locationViolations(diagnostics: unknown, sql: string | undefined): Violation[] {
  if (!Array.isArray(diagnostics)) return [];
  const out: Violation[] = [];
  const byteLength = sql === undefined ? undefined : new TextEncoder().encode(sql).length;
  diagnostics.forEach((diagnostic, i) => {
    const location = (diagnostic as { location?: { start?: unknown; end?: unknown } } | null)?.location;
    if (!location || typeof location !== 'object') return;
    const { start, end } = location;
    if (typeof start !== 'number' || !Number.isInteger(start) || start < 0) return;
    const prefix = `error.diagnostics.${i}.location`;
    if (typeof end === 'number' && end < start) out.push(v(`${prefix}.reversed`, `diagnostic ${i} has end ${end} < start ${start}`));
    if (byteLength !== undefined) {
      const last = typeof end === 'number' && end >= start ? end : start;
      if (last > byteLength) out.push(v(`${prefix}.out-of-range`, `diagnostic ${i} spans ${start}..${end ?? start} but the SQL is ${byteLength} UTF-8 bytes`));
    }
  });
  return out;
}

// Observed values become part of a violation id, so anything that is not a
// plain identifier collapses to `missing`.
function token(value: unknown) {
  return typeof value === 'string' && /^[A-Za-z0-9_]+$/.test(value) ? value : 'missing';
}

function headerProblem(name: string, actual: string | null, matcher: Matcher, vars: Record<string, string>) {
  if (typeof matcher === 'object' && 'absent' in matcher) {
    return actual === null ? undefined : `header ${name} should be absent, got ${JSON.stringify(actual)}`;
  }
  if (typeof matcher === 'string' && substitute(matcher, vars) === '') {
    return actual === null || actual.trim() === '' ? undefined : `header ${name} should be absent or empty, got ${JSON.stringify(actual)}`;
  }
  if (actual === null) return `header ${name} is missing`;
  if (typeof matcher === 'object' && 'present' in matcher) return undefined;
  return matchProblem(`header ${name}`, actual, matcher, vars);
}

function matchProblem(what: string, actual: string, matcher: Exclude<Matcher, { present: true } | { absent: true }>, vars: Record<string, string>) {
  if (typeof matcher === 'string') {
    const expected = substitute(matcher, vars);
    return actual.trim() === expected ? undefined : `${what} ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`;
  }
  if ('pattern' in matcher) {
    return new RegExp(matcher.pattern, 'i').test(actual)
      ? undefined
      : `${what} ${JSON.stringify(actual)} does not match /${matcher.pattern}/i`;
  }
  if ('anyOf' in matcher) {
    const options = matcher.anyOf.map(o => substitute(o, vars));
    return options.includes(actual.trim()) ? undefined : `${what} ${JSON.stringify(actual)} is none of ${JSON.stringify(options)}`;
  }
  if ('not' in matcher) {
    const forbidden = substitute(matcher.not, vars);
    return actual.trim() === forbidden ? `${what} ${JSON.stringify(actual)} should differ from ${JSON.stringify(forbidden)}` : undefined;
  }
  const present = actual.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (present.includes('*')) return undefined;
  const missing = matcher.tokens.filter(t => !present.includes(t.toLowerCase()));
  return missing.length ? `${what} ${JSON.stringify(actual)} lacks ${missing.join(', ')}` : undefined;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function describeBody(body: Uint8Array) {
  if (body.length === 0) return '(empty)';
  const text = textDecoder.decode(body.subarray(0, 160));
  const printable = /^[\x20-\x7e\s]*$/.test(text);
  return printable ? JSON.stringify(text) + (body.length > 160 ? '…' : '') : `(${body.length} binary bytes)`;
}

function describeText(text: string | undefined) {
  if (text === undefined) return '(none)';
  return JSON.stringify(text.length > 160 ? `${text.slice(0, 160)}…` : text);
}

// Captures never throw: a missing source becomes a violation and later steps
// that depend on the value report `blocked.<name>` instead of running.
// `body.a.b` walks the JSON body; `sqlname.a.b` renders the TableReference
// found there as a quoted SQL name.
export function captureValues(
  capture: Record<string, string> | undefined,
  response: Response,
  vars: Record<string, string>
): Violation[] {
  const out: Violation[] = [];
  for (const [name, source] of Object.entries(capture ?? {})) {
    const optional = source.endsWith('?');
    const [scope, ...rest] = (optional ? source.slice(0, -1) : source).split('.');
    const key = rest.join('.');
    if (scope === 'headers') {
      if (response.kind !== 'http') throw new Error(`cannot capture header ${key} from a non-HTTP response`);
      const value = response.headers.get(key);
      if (value === null) {
        if (optional) vars[name] = '';
        else out.push(v(`capture.${name}`, `cannot capture header ${key}: not present in the response`));
      } else {
        vars[name] = value;
      }
    } else if (scope === 'body' || scope === 'sqlname') {
      const text = response.kind === 'http' ? textDecoder.decode(response.body) : response.kind === 'ws' ? response.text ?? '' : '';
      const root = response.kind === 'connector' ? response.result
        : response.kind === 'comm' ? (response.replies[0]?.content as { result?: unknown } | undefined)?.result
          : parseJson(text);
      const value = rest.reduce<unknown>((node, part) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), root);
      if (value === undefined) {
        if (optional) vars[name] = '';
        else out.push(v(`capture.${name}`, `cannot capture ${scope}.${key} from ${response.kind === 'connector' || response.kind === 'comm' ? describeValue(root) : describeText(text)}`));
      } else if (scope === 'sqlname') {
        const rendered = sqlName(value);
        if (rendered === undefined) out.push(v(`capture.${name}`, `${key} is not a TableReference: ${JSON.stringify(value)}`));
        else vars[name] = rendered;
      } else {
        vars[name] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    } else {
      throw new Error(`unknown capture source ${source}`);
    }
  }
  return out;
}

function isReference(value: unknown): value is TableReference {
  const r = value as Partial<TableReference> | null;
  return typeof r === 'object' && r !== null
    && typeof r.catalog === 'string' && r.catalog !== ''
    && Array.isArray(r.schema) && r.schema.length > 0 && r.schema.every(s => typeof s === 'string' && s !== '')
    && typeof r.table === 'string' && r.table !== '';
}

export function sqlName(value: unknown): string | undefined {
  if (!isReference(value)) return undefined;
  return [value.catalog, ...value.schema, value.table].map(part => `"${part.replaceAll('"', '""')}"`).join('.');
}
