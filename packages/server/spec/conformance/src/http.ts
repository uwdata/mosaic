import { expandRequest, substitute } from './cases.ts';
import type { HttpResponse, Step, Transport } from './types.ts';

const defaultTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);

export async function sendHttp(
  baseUrl: string,
  transport: Transport,
  step: Step,
  vars: Record<string, string>
): Promise<HttpResponse> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(step.headers ?? {})) {
    headers.set(name, substitute(value, vars));
  }
  const request = step.request ? expandRequest(step.request, vars) : undefined;
  const raw = step.raw ?? {};
  let url = baseUrl;
  const method = raw.method ?? (transport === 'get' ? 'GET' : 'POST');
  let body: string | undefined;

  if (transport === 'get' && !raw.method) {
    const query = raw.query ?? toQuery(request ?? {});
    url = `${baseUrl}?${query}`;
  } else if (raw.body !== undefined) {
    body = raw.body;
    headers.set('content-type', raw.contentType ?? 'application/json');
  } else if (request) {
    body = JSON.stringify(request);
    headers.set('content-type', raw.contentType ?? 'application/json');
  }
  if (method === 'GET' || method === 'HEAD') body = undefined;
  if (raw.method && raw.query) url = `${baseUrl}?${raw.query}`;

  const res = await fetch(url, {
    method,
    headers,
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(defaultTimeout)
  });
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { kind: 'http', status: res.status, headers: res.headers, body: bytes };
}

function toQuery(request: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request)) {
    params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return params.toString();
}
