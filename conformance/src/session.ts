import { restConnector, socketConnector } from '@uwdata/mosaic-core';
import type { CommandTransport, ConnectorResponse } from './types.ts';

const stepTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);

// One live implementation of the command layer: a `Connector` for `rest`,
// `socket`, and `inproc`, or the widget comm client later. `query` takes the
// raw command object so malformed cases reach the implementation unchanged.
export interface Session {
  query(request: Record<string, unknown>): Promise<unknown>;
  dispose(): Promise<void>;
}

export type SessionFactory<T extends Disposable = Session> = () => Promise<T>;

export interface Disposable {
  dispose(): Promise<void>;
}

// A deadline only stops the harness waiting; the query may still be running.
// The response records that, and the manager below recreates the session
// before the next case so a late result cannot land in it.
export function issue(session: Session, request: Record<string, unknown>, timeout = stepTimeout): Promise<ConnectorResponse> {
  let settled = false;
  const query = session.query(request).then(
    (result): ConnectorResponse => ({ kind: 'connector', result }),
    (error): ConnectorResponse => ({ kind: 'connector-rejected', error })
  );
  query.then(() => { settled = true; });
  const deadline = new Promise<ConnectorResponse>(resolve => {
    setTimeout(() => { if (!settled) resolve({ kind: 'connector-timeout', after: timeout }); }, timeout).unref();
  });
  return Promise.race([query, deadline]);
}

// Owns the session for one target within a test worker. Sessions are shared
// across cases (an in-process engine is the implementation under test, not
// per-case state), except that a timed-out case leaves the session tainted
// and it is replaced before the next one.
export class SessionManager<T extends Disposable = Session> {
  private current?: Promise<T>;
  private tainted = false;

  constructor(private readonly factory: SessionFactory<T>) {}

  async acquire(): Promise<T> {
    if (this.tainted) {
      await this.dispose();
      this.tainted = false;
    }
    this.current ??= this.factory();
    return this.current;
  }

  taint() {
    this.tainted = true;
  }

  async dispose() {
    const session = this.current;
    this.current = undefined;
    if (!session) return;
    try {
      await (await session).dispose();
    } catch {
      // A session that cannot be disposed is abandoned; the next acquire
      // builds a fresh one regardless.
    }
  }
}

export function clientSession(transport: CommandTransport, url: string): Session {
  if (transport === 'rest') {
    const connector = restConnector({ uri: url });
    return {
      query: request => connector.query(request as never),
      dispose: async () => {}
    };
  }
  if (transport === 'socket') {
    const connector = socketConnector({ uri: url.replace(/^http/, 'ws') });
    return {
      query: request => connector.query(request as never),
      // SocketConnector has no close API yet; the socket is reached directly.
      dispose: async () => { (connector as unknown as { _ws?: { close(): void } | null })._ws?.close(); }
    };
  }
  throw new Error(`${transport} is not a client transport`);
}
