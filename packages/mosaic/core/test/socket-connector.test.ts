import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { ConnectorError } from '../src/connectors/errors.js';
import { SocketConnector } from '../src/connectors/socket.js';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  binaryType = '';
  sent: string[] = [];
  private listeners = new Map<string, (event?: unknown) => void>();

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event?: unknown) => void) {
    this.listeners.set(type, listener);
  }

  send(data: string) {
    this.sent.push(data);
  }

  emit(type: string, event?: unknown) {
    this.listeners.get(type)!(event);
  }
}

function connect() {
  const connector = new SocketConnector();
  const exec = (sql: string) => connector.query({ type: 'exec', sql });
  const socket = () => FakeWebSocket.instances.at(-1)!;
  return { connector, exec, socket };
}

describe('SocketConnector', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends every request once the socket is open, without waiting for responses', () => {
    const { exec, socket } = connect();
    exec('SELECT 1');
    exec('SELECT 2');
    expect(socket().sent).toHaveLength(0);

    socket().emit('open');
    exec('SELECT 3');
    expect(socket().sent.map(s => JSON.parse(s).sql)).toEqual(['SELECT 1', 'SELECT 2', 'SELECT 3']);
  });

  it('matches responses to requests in order', async () => {
    const { exec, socket } = connect();
    const first = exec('SELECT 1');
    const create = exec('CREATE TABLE t (a INT)');
    const failing = exec('SELECT oops').catch(error => error);
    const last = exec('SELECT 3');
    socket().emit('open');

    socket().emit('message', { data: JSON.stringify([{ a: 1 }]) });
    socket().emit('message', { data: '{}' });
    socket().emit('message', { data: JSON.stringify({ error: 'boom' }) });
    socket().emit('message', { data: JSON.stringify([{ a: 3 }]) });

    expect(await first).toEqual([{ a: 1 }]);
    await create;
    expect(await failing).toMatchObject({ name: 'ConnectorError', message: 'boom' });
    expect(await last).toEqual([{ a: 3 }]);
  });

  it('rejects every outstanding request when the socket closes', async () => {
    const { connector, exec, socket } = connect();
    const a = exec('SELECT 1');
    const b = exec('SELECT 2');
    const preagg = connector.query({ type: 'preagg', sql: 'SELECT 3' });
    socket().emit('open');
    socket().emit('close');

    await expect(a).rejects.toBe('Socket closed');
    await expect(b).rejects.toBe('Socket closed');
    await expect(preagg).rejects.toBe('Socket closed');
  });

  it('rejects outstanding requests on a socket error and only logs without any', async () => {
    const { exec, socket } = connect();
    const a = exec('SELECT 1').catch(error => error);
    socket().emit('open');
    socket().emit('error', 'boom');
    expect(await a).toBe('boom');

    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    socket().emit('error', 'later');
    expect(error).toHaveBeenCalledOnce();
  });

  it('opens a new socket after a close', async () => {
    const { exec, socket } = connect();
    exec('SELECT 1').catch(() => {});
    socket().emit('open');
    socket().emit('close');
    const first = socket();

    const later = exec('SELECT 2');
    expect(socket()).not.toBe(first);
    expect(socket().sent).toHaveLength(0);
    socket().emit('open');
    expect(socket().sent).toHaveLength(1);
    socket().emit('message', { data: JSON.stringify([{ a: 2 }]) });
    expect(await later).toEqual([{ a: 2 }]);
  });

  it('ignores a message with no request outstanding', () => {
    const { socket, exec } = connect();
    exec('SELECT 1');
    socket().emit('open');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    socket().emit('message', { data: '[]' });
    socket().emit('message', { data: '[]' });
    expect(log).toHaveBeenCalledOnce();
  });

  it('matches mixed preagg, Arrow, and exec responses in order', async () => {
    const { connector, exec, socket } = connect();
    const preagg = connector.query({ type: 'preagg', sql: 'SELECT 1 AS x' });
    const arrow = connector.query({ sql: 'SELECT 2 AS x' });
    const last = exec('SELECT 3');
    socket().emit('open');
    expect(socket().sent.map(s => JSON.parse(s).type)).toEqual(['preagg', 'arrow', 'exec']);

    const response = { catalog: 'memory', schema: 's', table: 't', createdAt: '2026-09-11T00:00:00Z' };
    socket().emit('message', { data: JSON.stringify(response) });
    socket().emit('message', { data: tableToIPC(tableFromArrays({ x: [2] }), { format: 'stream' }) });
    socket().emit('message', { data: '{}' });
    expect(await preagg).toEqual(response);
    expect((await arrow).toArray()).toEqual([{ x: 2 }]);
    await last;
  });

  it.each([
    { name: 'preagg', query: (c: SocketConnector) => c.query({ type: 'preagg', sql: 'SELECT 1' }) },
    { name: 'arrow', query: (c: SocketConnector) => c.query({ type: 'arrow', sql: 'SELECT 1' }) },
    { name: 'default', query: (c: SocketConnector) => c.query({ sql: 'SELECT 1' }) }
  ])('preserves structured errors for $name requests', async ({ query }) => {
    const { connector, socket } = connect();
    const result = query(connector).catch(error => error);
    socket().emit('open');
    socket().emit('message', { data: JSON.stringify({
      error: 'missing table', code: 'table_not_found', catalog: 'memory', schema: 's', table: 't'
    }) });
    const error = await result;
    expect(error).toBeInstanceOf(ConnectorError);
    expect(error).toMatchObject({ message: 'missing table', code: 'table_not_found', catalog: 'memory', schema: 's', table: 't' });
    expect(error.status).toBeUndefined();
  });

  it.each([
    { name: 'malformed JSON', query: (c: SocketConnector) => c.query({ type: 'preagg', sql: 'SELECT 1' }), data: '[' },
    { name: 'binary preagg response', query: (c: SocketConnector) => c.query({ type: 'preagg', sql: 'SELECT 1' }), data: new Uint8Array([1, 2, 3]) },
    { name: 'JSON Arrow response', query: (c: SocketConnector) => c.query({ sql: 'SELECT 1' }), data: '{}' }
  ])('rejects $name without losing the next response', async ({ query, data }) => {
    const { connector, exec, socket } = connect();
    const result = query(connector).catch(error => error);
    const next = exec('SELECT 2');
    socket().emit('open');
    socket().emit('message', { data });
    socket().emit('message', { data: '{}' });
    expect(await result).toBeInstanceOf(Error);
    await next;
  });

  it('decodes binary responses for arrow requests and resolves exec on text', async () => {
    const { connector, socket } = connect();
    const exec = connector.query({ type: 'exec', sql: 'CREATE TABLE t (a INT)' });
    const arrow = connector.query({ type: 'arrow', sql: 'SELECT 1' }).catch(error => error);
    socket().emit('open');
    socket().emit('message', { data: '{}' });
    socket().emit('message', { data: new Uint8Array([1, 2, 3]) });
    await exec;
    // an undecodable buffer rejects instead of leaving the request pending
    expect(await arrow).toBeInstanceOf(Error);
  });
});
