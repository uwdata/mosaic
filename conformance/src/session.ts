import { restConnector, socketConnector } from '@uwdata/mosaic-core';
import { classifyFetchError } from './http.ts';
import type { CommandTransport, ConnectorResponse } from './types.ts';

const stepTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);

export interface Disposable {
  // Whether `dispose` leaves nothing of this session running anywhere: an
  // in-process engine is terminated, a shim process is killed, but a client
  // connector cannot stop SQL already executing on a server.
  isolated: boolean;
  dispose(): Promise<void>;
}

// One live implementation of the command layer: a `Connector` for `rest`,
// `socket`, and `inproc`. `query` takes the raw command object so malformed
// cases reach the implementation unchanged. `transportFailure` picks out
// rejections that mean the request was never delivered; those are harness
// errors, never observations.
export interface Session extends Disposable {
  query(request: Record<string, unknown>): Promise<unknown>;
  transportFailure?(error: unknown): Error | undefined;
}

export type SessionFactory<T extends Disposable = Session> = () => Promise<T>;

export class TransportError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = 'TransportError';
  }
}

// A deadline only stops the harness waiting; the query may still be running.
// The response records that, and the manager below decides whether the
// session can be replaced before the next case. A rejection the session
// classifies as a delivery failure is rethrown so the case fails as a harness
// error instead of matching an uncoded-error baseline.
export function issue(session: Session, request: Record<string, unknown>, timeout = stepTimeout): Promise<ConnectorResponse> {
  let settled = false;
  const query = session.query(request).then(
    (result): ConnectorResponse => ({ kind: 'connector', result }),
    (error): ConnectorResponse => {
      const fatal = session.transportFailure?.(error);
      if (fatal) throw fatal;
      return { kind: 'connector-rejected', error };
    }
  );
  query.then(() => { settled = true; }, () => { settled = true; });
  const deadline = new Promise<ConnectorResponse>(resolve => {
    setTimeout(() => { if (!settled) resolve({ kind: 'connector-timeout', after: timeout }); }, timeout).unref();
  });
  return Promise.race([query, deadline]);
}

// Owns the session for one target within a test worker. Sessions are shared
// across cases (an in-process engine is the implementation under test, not
// per-case state). A timed-out case leaves the session tainted: if disposing
// it isolates the implementation, a fresh one is built; if it cannot (a
// client connector against a server that may still be executing), or if
// disposal itself fails, the state is unknown and every later acquire throws
// so the remaining cases fail as harness errors rather than run against it.
export class SessionManager<T extends Disposable = Session> {
  private current?: Promise<T>;
  private tainted = false;
  private aborted?: Error;

  constructor(private readonly factory: SessionFactory<T>) {}

  async acquire(): Promise<T> {
    if (this.aborted) throw this.aborted;
    if (this.tainted) {
      this.tainted = false;
      const session = await this.current!;
      if (!session.isolated) {
        this.aborted = new Error('target state is unknown after a timed-out command that disposing the session cannot cancel; aborting the remaining cases');
        throw this.aborted;
      }
      try {
        await this.dispose();
      } catch (err) {
        this.aborted = new Error(`could not dispose the session after a timeout, so the target state is unknown; aborting the remaining cases (${(err as Error).message})`, { cause: err });
        throw this.aborted;
      }
    }
    this.current ??= this.factory();
    return this.current;
  }

  taint() {
    if (this.current) this.tainted = true;
  }

  async dispose() {
    const session = this.current;
    this.current = undefined;
    if (!session) return;
    await (await session).dispose();
  }
}

const socketClosed = 'WebSocket connection failed before the command was delivered';

export function clientSession(transport: CommandTransport, url: string): Session {
  if (transport === 'rest') {
    const connector = restConnector({ uri: url });
    return {
      isolated: false,
      query: request => connector.query(request as never),
      // undici reports every network failure as `TypeError: fetch failed`
      // with the real cause underneath. Only a reset after the request went
      // out is server behaviour; anything else never reached the server.
      transportFailure: error => (error instanceof TypeError && error.message === 'fetch failed' && !classifyFetchError(error)
        ? new TransportError(`could not deliver the request over rest: ${(error as { cause?: Error }).cause?.message ?? error.message}`, error)
        : undefined),
      dispose: async () => {}
    };
  }
  if (transport === 'socket') {
    const connector = socketConnector({ uri: url.replace(/^http/, 'ws') });
    return {
      isolated: false,
      query: request => connector.query(request as never),
      // SocketConnector rejects queued queries with the browser `error`
      // Event when the connection cannot be made; a server that answers
      // with an error frame rejects with that frame's string instead.
      transportFailure: error => (typeof error === 'object' && error !== null && (error as { type?: unknown }).type === 'error'
        ? new TransportError(socketClosed, error)
        : undefined),
      // SocketConnector has no close API yet; the socket is reached directly.
      dispose: async () => { (connector as unknown as { _ws?: { close(): void } | null })._ws?.close(); }
    };
  }
  throw new Error(`${transport} is not a client transport`);
}
