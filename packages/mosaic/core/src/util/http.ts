import { abortable } from './abort.js';

export type HeadersOption = HeadersInit | (() => HeadersInit | Promise<HeadersInit>);

export async function resolveHeaders(headers: HeadersOption | undefined, signal?: AbortSignal): Promise<Headers> {
  signal?.throwIfAborted();
  const init = typeof headers === 'function' ? headers() : headers;
  const resolved = new Headers(
    await (signal ? abortable(Promise.resolve(init), signal) : init)
  );
  signal?.throwIfAborted();
  return resolved;
}

export function withParams(uri: string, params: Record<string, string> | URLSearchParams): string {
  const end = uri.includes('#') ? uri.indexOf('#') : uri.length;
  const start = uri.indexOf('?');
  const search = start >= 0 && start < end;
  const merged = new URLSearchParams(search ? uri.slice(start + 1, end) : '');
  for (const [key, value] of new URLSearchParams(params)) merged.set(key, value);
  return `${uri.slice(0, search ? start : end)}?${merged}${uri.slice(end)}`;
}
