import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import { once } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { dataServer } from '../src/data-server.js';

const chunks = [Buffer.from('schema '.repeat(400)), Buffer.from('records '.repeat(1000))];
let server;
let port;
const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

beforeAll(async () => {
  server = dataServer({ exec: async () => {}, arrowBuffer: async sql => sql === 'small' ? [Buffer.from('small')] : chunks }, { port: 0, socket: false });
  await once(server, 'listening');
  port = server.address().port;
});

afterAll(async () => {
  agent.destroy();
  await new Promise(resolve => server.close(resolve));
});

/** @param {string | undefined} encoding @param {{type?: string, sql: string}} [query] */
function request(encoding, query = { type: 'arrow', sql: 'large' }) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (encoding !== undefined) headers['Accept-Encoding'] = encoding;
    const req = http.request({ host: '127.0.0.1', port, method: 'POST', headers, agent }, res => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(data), reused: req.reusedSocket }));
    });
    req.on('error', reject);
    req.end(JSON.stringify(query));
  });
}

describe('HTTP Arrow compression', () => {
  it('allows compression to be disabled without ignoring identity exclusions', async () => {
    const plain = dataServer({ exec: async () => {}, arrowBuffer: async () => chunks }, { port: 0, socket: false, compression: false });
    await once(plain, 'listening');
    const address = plain.address();
    if (typeof address === 'string') throw new Error('Expected TCP listener');
    try {
      for (const [header, status] of [['gzip', 200], ['gzip,identity;q=0', 406]]) {
        const response = await fetch(`http://127.0.0.1:${address.port}`, {
          method: 'POST', headers: { 'Accept-Encoding': String(header) },
          body: JSON.stringify({ type: 'arrow', sql: 'large' })
        });
        expect(response.status).toBe(status);
        expect(response.headers.get('content-encoding')).toBeNull();
        const data = Buffer.from(await response.arrayBuffer());
        if (status === 200) expect(data).toEqual(Buffer.concat(chunks));
      }
    } finally {
      plain.closeAllConnections();
      await new Promise(resolve => plain.close(resolve));
    }
  });
  it.each(['gzip', 'GZip; q=1', 'gzip ; q=1', 'gzip\t; q=1', 'br, gzip', '*', 'identity;q=0, gzip;q=0.5', '*;q=0, gzip'])('compresses when acceptable: %s', async header => {
    const response = await request(header);
    expect(response.status).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers.vary).toBe('Accept-Encoding');
    expect(response.headers['content-type']).toBe('application/vnd.apache.arrow.stream');
    expect(gunzipSync(response.data)).toEqual(Buffer.concat(chunks));
    expect(response.data.length).toBeLessThan(Buffer.concat(chunks).length);
  });

  it.each([undefined, '', 'br', 'gzip;q=0', '*;q=1,gzip;q=0', 'gzip;q=0.5,identity;q=1', 'gzip;q=invalid'])('keeps identity when preferred: %s', async header => {
    const response = await request(header);
    expect(response.status).toBe(200);
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.headers.vary).toBe('Accept-Encoding');
    expect(response.data).toEqual(Buffer.concat(chunks));
  });

  it('honors identity exclusion for small responses', async () => {
    const identity = await request('gzip', { type: 'arrow', sql: 'small' });
    expect(identity.headers['content-encoding']).toBeUndefined();
    const gzip = await request('gzip, identity;q=0', { type: 'arrow', sql: 'small' });
    expect(gunzipSync(gzip.data).toString()).toBe('small');
  });

  it.each(['identity;q=0', '*;q=0', 'gzip;q=0,identity;q=0'])('rejects unacceptable encodings: %s', async header => {
    expect((await request(header)).status).toBe(406);
  });

  it('preserves exec and error responses on a reused connection', async () => {
    await request('gzip');
    const exec = await request('gzip', { type: 'exec', sql: 'SELECT 1' });
    expect(exec.reused).toBe(true);
    expect(exec.status).toBe(200);
    expect(exec.data.length).toBe(0);
    expect(exec.headers['content-encoding']).toBeUndefined();
    const error = await request('gzip', { sql: 'SELECT 1' });
    expect(error.status).toBe(400);
    expect(error.headers['content-encoding']).toBeUndefined();
  });
});
