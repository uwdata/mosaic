import { arrowProblems } from './arrow.ts';
import { substitute } from './cases.ts';
import { schemaErrors } from './schema.ts';
import { canonicalStatus, type Expectation, type Matcher, type Response, type Transport } from './types.ts';

const arrowMediaType = 'application/vnd.apache.arrow.stream';
const textDecoder = new TextDecoder();

export function checkResponse(
  expectation: Expectation,
  response: Response,
  transport: Transport,
  vars: Record<string, string>
): string[] {
  if (expectation.oneOf) {
    const attempts = expectation.oneOf.map(e => checkResponse(e, response, transport, vars));
    if (attempts.some(a => a.length === 0)) return [];
    return [`none of the accepted alternatives matched:\n${attempts.map((a, i) => `  [${i}] ${a.join('; ')}`).join('\n')}`];
  }

  const problems: string[] = [];
  if (response.kind === 'ws' && (response.frame === 'close' || response.frame === 'timeout')) {
    return [response.frame === 'close'
      ? `connection closed (code ${response.closeCode}${response.closeReason ? `, ${response.closeReason}` : ''}) instead of answering`
      : 'no response frame received before the timeout'];
  }

  if (expectation.arrow) {
    if (response.kind === 'http') {
      if (response.status !== 200) problems.push(`status ${response.status} != 200; body ${describeBody(response.body)}`);
      const type = response.headers.get('content-type') ?? '';
      if (!type.startsWith(arrowMediaType)) problems.push(`content-type ${JSON.stringify(type)} != ${arrowMediaType}`);
      problems.push(...arrowProblems(response.body, expectation.arrow));
    } else if (response.frame !== 'binary') {
      problems.push(`expected a binary Arrow frame, got text frame ${describeText(response.text)}`);
    } else {
      problems.push(...arrowProblems(response.body, expectation.arrow));
    }
  }

  if (expectation.exec) {
    if (response.kind === 'http') {
      if (response.status !== 200) problems.push(`status ${response.status} != 200; body ${describeBody(response.body)}`);
      if (response.body.length !== 0) problems.push(`exec body should be empty, got ${describeBody(response.body)}`);
    } else if (response.frame !== 'text') {
      problems.push('expected a text frame `{}` for exec, got a binary frame');
    } else {
      const parsed = parseJson(response.text!);
      if (parsed === undefined) problems.push(`exec acknowledgement is not JSON: ${describeText(response.text)}`);
      else problems.push(...schemaErrors('ExecResponse', parsed).map(e => `exec acknowledgement: ${e}`));
    }
  }

  if (expectation.json) {
    const text = response.kind === 'http' ? textDecoder.decode(response.body) : response.text;
    if (response.kind === 'http') {
      if (response.status !== 200) problems.push(`status ${response.status} != 200; body ${describeBody(response.body)}`);
      if (!(response.headers.get('content-type') ?? '').startsWith('application/json')) {
        problems.push(`content-type ${JSON.stringify(response.headers.get('content-type'))} is not application/json`);
      }
    } else if (response.frame !== 'text') {
      problems.push('expected a text frame, got a binary frame');
    }
    const parsed = text === undefined ? undefined : parseJson(text);
    if (parsed === undefined) problems.push(`body is not JSON: ${describeText(text)}`);
    else problems.push(...schemaErrors(expectation.json, parsed).map(e => `${expectation.json}: ${e}`));
  }

  if (expectation.error) {
    const { code, message } = expectation.error;
    let text: string | undefined;
    if (response.kind === 'http') {
      const status = expectation.error.status ?? canonicalStatus[code];
      if (response.status !== status) problems.push(`status ${response.status} != ${status}`);
      const type = response.headers.get('content-type') ?? '';
      if (!type.startsWith('application/json')) problems.push(`error content-type ${JSON.stringify(type)} is not application/json`);
      text = textDecoder.decode(response.body);
    } else if (response.frame !== 'text') {
      problems.push('expected an Error text frame, got a binary frame');
    } else {
      text = response.text;
    }
    if (text !== undefined) {
      const parsed = parseJson(text);
      if (parsed === undefined || typeof parsed !== 'object' || parsed === null) {
        problems.push(`error body is not a JSON object: ${describeText(text)}`);
      } else {
        problems.push(...schemaErrors('Error', parsed).map(e => `Error envelope: ${e}`));
        const envelope = parsed as { code?: unknown; error?: unknown };
        if (envelope.code !== code) problems.push(`code ${JSON.stringify(envelope.code)} != ${code}`);
        if (message !== undefined && typeof envelope.error === 'string') {
          const problem = matchProblem('error message', envelope.error, message, vars);
          if (problem) problems.push(problem);
        }
      }
    }
  }

  if (response.kind === 'http') {
    if (expectation.status !== undefined) {
      const accepted = Array.isArray(expectation.status) ? expectation.status : [expectation.status];
      if (!accepted.includes(response.status)) {
        problems.push(`status ${response.status} not in ${JSON.stringify(accepted)}; body ${describeBody(response.body)}`);
      }
    }
    if (expectation.empty && response.body.length !== 0) {
      problems.push(`body should be empty, got ${describeBody(response.body)}`);
    }
    for (const [name, matcher] of Object.entries(expectation.headers ?? {})) {
      const problem = headerProblem(name, response.headers.get(name), matcher, vars);
      if (problem) problems.push(problem);
    }
  } else if (expectation.status !== undefined || expectation.headers || expectation.empty) {
    throw new Error('status/headers/empty expectations only apply to HTTP transports');
  }

  return problems;
}

function headerProblem(name: string, actual: string | null, matcher: Matcher, vars: Record<string, string>) {
  if (typeof matcher === 'object' && 'absent' in matcher) {
    return actual === null ? undefined : `header ${name} should be absent, got ${JSON.stringify(actual)}`;
  }
  if (actual === null) return `header ${name} is missing`;
  if (typeof matcher === 'object' && 'present' in matcher) return undefined;
  return matchProblem(`header ${name}`, actual, matcher, vars);
}

function matchProblem(what: string, actual: string, matcher: string | { pattern: string }, vars: Record<string, string>) {
  if (typeof matcher === 'string') {
    const expected = substitute(matcher, vars);
    return actual.trim() === expected ? undefined : `${what} ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`;
  }
  return new RegExp(matcher.pattern, 'i').test(actual)
    ? undefined
    : `${what} ${JSON.stringify(actual)} does not match /${matcher.pattern}/i`;
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

export function captureValues(
  capture: Record<string, string> | undefined,
  response: Response,
  vars: Record<string, string>
) {
  for (const [name, source] of Object.entries(capture ?? {})) {
    const [scope, ...rest] = source.split('.');
    const key = rest.join('.');
    if (scope === 'headers') {
      if (response.kind !== 'http') throw new Error(`cannot capture header ${key} from a WebSocket frame`);
      const value = response.headers.get(key);
      if (value === null) throw new Error(`cannot capture header ${key}: not present in the response`);
      vars[name] = value;
    } else if (scope === 'body') {
      const text = response.kind === 'http' ? textDecoder.decode(response.body) : response.text ?? '';
      const parsed = parseJson(text) as Record<string, unknown> | undefined;
      if (!parsed || !(key in parsed)) throw new Error(`cannot capture body.${key} from ${describeText(text)}`);
      vars[name] = String(parsed[key]);
    } else {
      throw new Error(`unknown capture source ${source}`);
    }
  }
}
