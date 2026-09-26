import { once } from 'node:events';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { surplusViolations } from './src/check.ts';
import { WsClient } from './src/ws.ts';

const frame = new Uint8Array([1, 2, 3]);
const servers: WebSocketServer[] = [];

async function serve(onMessage: (send: (data: Uint8Array | string) => void) => void): Promise<string> {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  servers.push(server);
  server.on('connection', socket => socket.on('message', () => onMessage(data => socket.send(data))));
  await once(server, 'listening');
  const { port } = server.address() as { port: number };
  return `ws://127.0.0.1:${port}/`;
}

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe('WebSocket reply cardinality', () => {
  const command = { request: { type: 'arrow', sql: 'SELECT 1' }, expect: {} };

  it('sees nothing after a single reply', async () => {
    const client = await WsClient.open(await serve(send => send(frame)));
    client.send(command, {});
    expect((await client.next()).frame).toBe('binary');
    expect(await client.surplus(100)).toEqual([]);
    client.close();
  });

  it('catches a duplicate sent immediately and one sent on a later turn', async () => {
    const immediate = await WsClient.open(await serve(send => { send(frame); send(frame); }));
    immediate.send(command, {});
    await immediate.next();
    const extra = await immediate.surplus(100);
    expect(extra.map(f => f.frame)).toEqual(['binary']);
    expect(surplusViolations(extra).map(v => v.id)).toEqual(['ws.surplus-reply']);
    immediate.close();

    const delayed = await WsClient.open(await serve(send => { send(frame); setTimeout(() => send('{"error":"late"}'), 30); }));
    delayed.send(command, {});
    await delayed.next();
    const late = await delayed.surplus(150);
    expect(late.map(f => f.frame)).toEqual(['text']);
    expect(surplusViolations(late)[0].detail).toMatch(/1 unexpected frame after the last reply: text/);
    delayed.close();
  });

  it('counts surplus after a pipeline, not the replies the pipeline expects', async () => {
    const client = await WsClient.open(await serve(send => { send(frame); send(frame); }));
    client.send(command, {});
    client.send(command, {});
    await client.next();
    await client.next();
    expect((await client.surplus(100)).length).toBe(2);
    expect(surplusViolations([])).toEqual([]);
    client.close();
  });
});
