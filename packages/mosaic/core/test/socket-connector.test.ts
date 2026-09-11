import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocketConnector } from '../src/connectors/socket.js';

type Listener = (event?: unknown) => void;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  binaryType = 'blob';
  sent: string[] = [];
  private listeners = new Map<string, Listener>();

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, fn: Listener) {
    this.listeners.set(type, fn);
  }

  send(data: string) {
    this.sent.push(data);
  }

  emit(type: string, event?: unknown) {
    this.listeners.get(type)?.(event);
  }
}

describe('SocketConnector', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects the in-flight and queued requests when the socket closes', async () => {
    const connector = new SocketConnector({ uri: 'ws://test/' });
    const active = connector.query({ type: 'exec', sql: 'SELECT 1' });
    const queued = connector.query({ type: 'exec', sql: 'SELECT 2' });
    const socket = FakeWebSocket.instances[0];
    socket.emit('open');
    expect(socket.sent).toHaveLength(1);

    socket.emit('close');
    await expect(active).rejects.toBe('Socket closed');
    await expect(queued).rejects.toBe('Socket closed');
    expect(connector.connected).toBe(false);

    connector.query({ type: 'exec', sql: 'SELECT 3' });
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});
