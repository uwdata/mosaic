import { encodeCommand, expandRequest, substitute } from './cases.ts';
import type { HttpFailure, HttpResponse, Step, Transport } from './types.ts';

const defaultTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);

// Only a connection the server tears down after accepting the request is a
// server behaviour worth baselining. Refusals, DNS or TLS failures, bad URLs,
// and timeouts mean the harness could not deliver the request and must fail
// the run instead of matching a baseline entry.
const postSendResets: Record<string, string> = {
  ECONNRESET: 'econnreset',
  EPIPE: 'epipe',
  UND_ERR_SOCKET: 'socket-closed'
};

export function classifyFetchError(err: unknown): HttpFailure | undefined {
  const cause = (err as { cause?: { code?: string; message?: string } }).cause;
  const code = cause?.code ?? '';
  const reset = postSendResets[code];
  if (!reset) return undefined;
  return { kind: 'http-failed', reset, error: `${(err as Error).message}: ${cause?.message ?? code}` };
}

export async function sendHttp(
  baseUrl: string,
  transport: Transport,
  step: Step,
  vars: Record<string, string>
): Promise<HttpResponse | HttpFailure> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(step.headers ?? {})) {
    headers.set(name, substitute(value, vars));
  }
  const request = step.request ? expandRequest(step.request, vars, transport) : undefined;
  const raw = step.raw ?? {};
  let url = baseUrl;
  const method = raw.method ?? (transport === 'get' ? 'GET' : 'POST');
  let body: string | undefined;

  if (transport === 'get' && !raw.method) {
    const query = raw.query ?? encodeCommand(request ?? {}, transport);
    url = `${baseUrl}?${query}`;
  } else if (raw.body !== undefined) {
    body = substitute(raw.body, vars);
    headers.set('content-type', raw.contentType ?? 'application/json');
  } else if (request) {
    body = encodeCommand(request, transport);
    headers.set('content-type', raw.contentType ?? 'application/json');
  }
  if (method === 'GET' || method === 'HEAD') body = undefined;
  if (raw.method && raw.query) url = `${baseUrl}?${substitute(raw.query, vars)}`;

  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(defaultTimeout)
    });
  } catch (err) {
    const failure = classifyFetchError(err);
    if (failure) return failure;
    const cause = (err as { cause?: Error }).cause;
    throw new Error(`could not deliver ${method} ${url.slice(0, 120)}: ${(err as Error).message}${cause ? ` (${cause.message})` : ''}`, { cause: err });
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { kind: 'http', status: res.status, headers: res.headers, body: bytes };
}
