import { afterEach, expect, it, vi } from 'vitest';
import { SocketConnector } from '../src/connectors/socket.js';

afterEach(() => vi.unstubAllGlobals());

it('rejects the in-flight and queued requests when the socket closes', async () => {
  const listeners: Record<string, (event?: unknown) => void> = {};
  vi.stubGlobal('WebSocket', class {
    addEventListener(type: string, fn: (event?: unknown) => void) { listeners[type] = fn; }
    send() {}
  });
  const connector = new SocketConnector();
  const active = connector.query({ type: 'exec', sql: 'SELECT 1' });
  const queued = connector.query({ type: 'exec', sql: 'SELECT 2' });
  listeners.open();
  listeners.close();
  await expect(active).rejects.toBe('Socket closed');
  await expect(queued).rejects.toBe('Socket closed');
});
