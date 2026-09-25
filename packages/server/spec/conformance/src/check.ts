import { arrowViolations } from './arrow.ts';
import { substitute } from './cases.ts';
import { schemaViolations } from './schema.ts';
import { canonicalStatus, type Expectation, type Matcher, type Response, type Transport, type Violation } from './types.ts';

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
  vars: Record<string, string>
): Violation[] {
  if (expectation.oneOf) {
    const attempts = expectation.oneOf.map(e => checkResponse(e, response, transport, vars));
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
    return [v(`http.reset.${response.reset}`, `server closed the connection without an HTTP response: ${response.error}`)];
  }
  if (response.kind === 'ws' && response.frame === 'close') {
    return [v(`ws.closed.${response.closeCode ?? 'unknown'}`, `connection closed (code ${response.closeCode}${response.closeReason ? `, ${response.closeReason}` : ''}) instead of answering`)];
  }
  if (response.kind === 'ws' && response.frame === 'timeout') {
    return [v('ws.no-reply', 'no response frame received before the timeout')];
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
    const { code, message } = expectation.error;
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
        out.push(...schemaViolations('error.schema', 'Error', parsed));
        const envelope = parsed as { code?: unknown; error?: unknown };
        if (envelope.code !== code) out.push(v(`error.code.${typeof envelope.code === 'string' && /^[a-z_]+$/.test(envelope.code) ? envelope.code : 'missing'}`, `code ${JSON.stringify(envelope.code)} != ${code}`));
        if (message !== undefined && typeof envelope.error === 'string') {
          const problem = matchProblem('error message', envelope.error, message, vars);
          if (problem) out.push(v('error.message', problem));
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
    } else if (scope === 'body') {
      const text = response.kind === 'http' ? textDecoder.decode(response.body) : response.kind === 'ws' ? response.text ?? '' : '';
      const parsed = parseJson(text) as Record<string, unknown> | undefined;
      if (!parsed || typeof parsed !== 'object' || !(key in parsed)) {
        if (optional) vars[name] = '';
        else out.push(v(`capture.${name}`, `cannot capture body.${key} from ${describeText(text)}`));
      } else {
        vars[name] = String(parsed[key]);
      }
    } else {
      throw new Error(`unknown capture source ${source}`);
    }
  }
  return out;
}
