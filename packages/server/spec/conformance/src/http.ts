import { encodeCommand, expandRequest, substitute } from './cases.ts';
import type { HttpFailure, HttpResponse, Step, Transport } from './types.ts';

const defaultTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);

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

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(defaultTimeout)
    });
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { kind: 'http', status: res.status, headers: res.headers, body: bytes };
  } catch (err) {
    const cause = (err as Error & { cause?: Error }).cause;
    return { kind: 'http-failed', error: cause ? `${(err as Error).message}: ${cause.message}` : (err as Error).message };
  }
}
