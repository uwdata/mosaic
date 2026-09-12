import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  const arrow = (sql: string) => connector.query({ type: 'arrow', sql });
  const socket = () => FakeWebSocket.instances.at(-1)!;
  return { connector, exec, arrow, socket };
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
    const { exec, arrow, socket } = connect();
    const first = arrow('SELECT 1');
    const create = exec('CREATE TABLE t (a INT)');
    const failing = exec('SELECT oops').catch(error => error);
    const last = arrow('SELECT 3');
    const one = new Uint8Array([1]);
    const three = new Uint8Array([3]);
    socket().emit('open');

    socket().emit('message', { data: one });
    socket().emit('message', { data: '{}' });
    socket().emit('message', { data: JSON.stringify({ error: 'boom' }) });
    socket().emit('message', { data: three });

    expect(await first).toBe(one);
    expect(await create).toBeUndefined();
    expect(await failing).toBe('boom');
    expect(await last).toBe(three);
  });

  it('rejects every outstanding request when the socket closes', async () => {
    const { exec, socket } = connect();
    const a = exec('SELECT 1');
    const b = exec('SELECT 2');
    socket().emit('open');
    socket().emit('close');

    await expect(a).rejects.toBe('Socket closed');
    await expect(b).rejects.toBe('Socket closed');
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
    const { exec, arrow, socket } = connect();
    exec('SELECT 1').catch(() => {});
    socket().emit('open');
    socket().emit('close');
    const first = socket();

    const later = arrow('SELECT 2');
    const bytes = new Uint8Array([2]);
    expect(socket()).not.toBe(first);
    expect(socket().sent).toHaveLength(0);
    socket().emit('open');
    expect(socket().sent).toHaveLength(1);
    socket().emit('message', { data: bytes });
    expect(await later).toBe(bytes);
  });

  it('ignores a message with no request outstanding', () => {
    const { socket, exec } = connect();
    exec('SELECT 1');
    socket().emit('open');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    socket().emit('message', { data: '{}' });
    socket().emit('message', { data: '{}' });
    expect(log).toHaveBeenCalledOnce();
  });

  it('resolves arrow requests with the raw bytes and exec acknowledgements with nothing', async () => {
    const { exec, arrow, socket } = connect();
    const create = exec('CREATE TABLE t (a INT)');
    const select = arrow('SELECT 1');
    const bytes = new Uint8Array([1, 2, 3]);
    socket().emit('open');
    socket().emit('message', { data: '{}' });
    socket().emit('message', { data: bytes });
    expect(await create).toBeUndefined();
    expect(await select).toBe(bytes);
  });
});
