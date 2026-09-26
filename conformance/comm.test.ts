import path from 'node:path';
import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { afterEach, describe, expect, it } from 'vitest';
import { checkResponse } from './src/check.ts';
import { CommClient, parseShimRecord } from './src/comm.ts';
import type { CommResponse, Violation } from './src/types.ts';

const ids = (violations: Violation[]) => violations.map(v => v.id).sort();
const fake = { cmd: process.execPath, args: [path.join(import.meta.dirname, 'fixtures/fake-shim.mjs')], cwd: import.meta.dirname };
const clients: CommClient[] = [];
const client = () => { const c = new CommClient(fake); clients.push(c); return c; };
afterEach(async () => { for (const c of clients.splice(0)) await c.dispose(); });

const stream = tableToIPC(tableFromArrays({ x: [1] }), { format: 'stream' })!;
const comm = (content: unknown, uuid: string | undefined, buffers: Uint8Array[] = [], raised?: string): CommResponse =>
  ({ kind: 'comm', uuid, replies: content === undefined ? [] : [{ content, buffers }], ...(raised ? { raised } : {}) });

describe('comm reply checks', () => {
  it('accepts each framed reply with the payload where the spec puts it', () => {
    expect(checkResponse({ arrow: { rows: [[1]] } }, comm({ type: 'arrow', uuid: 'u1' }, 'u1', [stream]), 'comm', {})).toEqual([]);
    expect(checkResponse({ exec: true }, comm({ type: 'exec', uuid: 'u1' }, 'u1'), 'comm', {})).toEqual([]);
    const preagg = { reference: { catalog: 'memory', schema: ['main'], table: 't' }, createdAt: '2026-09-25T10:00:00Z' };
    expect(checkResponse({ json: 'PreaggResponse' }, comm({ type: 'preagg', uuid: 'u1', result: preagg }, 'u1'), 'comm', {})).toEqual([]);
    const envelope = { error: 'no sql', code: 'bad_request', reason: 'missing_field', field: 'sql' };
    expect(checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'sql' } }, comm({ type: 'error', uuid: 'u1', error: envelope }, 'u1'), 'comm', {})).toEqual([]);
  });

  it('requires an uncorrelated error when no valid uuid was sent, and a match otherwise', () => {
    const envelope = { error: 'no uuid', code: 'bad_request', reason: 'missing_field', field: 'uuid' };
    const expectation = { error: { code: 'bad_request' as const, reason: 'missing_field' as const, field: 'uuid' } };
    expect(checkResponse(expectation, comm({ type: 'error', uuid: null, error: envelope }, undefined), 'comm', {})).toEqual([]);
    expect(ids(checkResponse(expectation, comm({ type: 'error', uuid: '', error: envelope }, undefined), 'comm', {}))).toEqual(['comm.schema.minlength.uuid', 'comm.schema.type.uuid', 'comm.uuid.not-null']);
    expect(ids(checkResponse({ exec: true }, comm({ type: 'exec', uuid: 'someone-else' }, 'u1'), 'comm', {}))).toEqual(['comm.uuid.mismatch']);
    expect(ids(checkResponse({ exec: true }, comm({ type: 'exec' }, 'u1'), 'comm', {}))).toEqual(['comm.schema.required.uuid', 'comm.uuid.missing']);
  });

  it('names the widget\'s current error shape precisely', () => {
    const out = checkResponse({ error: { code: 'bad_request', reason: 'sql_parse_error' } }, comm({ error: 'Parser Error', uuid: 'u1' }, 'u1'), 'comm', {});
    expect(ids(out)).toEqual(['comm.error.not-object', 'comm.reply.type.missing']);
    const executed = checkResponse({ error: { code: 'bad_request', reason: 'invalid_field', field: 'uuid' } }, comm({ type: 'arrow', uuid: '' }, undefined, [stream]), 'comm', {});
    expect(ids(executed)).toEqual(['comm.buffers.1', 'comm.error.not-object', 'comm.reply.type.arrow', 'comm.uuid.not-null']);
  });

  it('separates no reply, a raise after replying, surplus replies, and a timeout', () => {
    expect(ids(checkResponse({ arrow: true }, comm(undefined, 'u1', [], "KeyError: 'uuid'"), 'comm', {}))).toEqual(['comm.no-reply']);
    expect(checkResponse({ arrow: true }, comm(undefined, 'u1', [], "KeyError: 'uuid'"), 'comm', {})[0].detail).toMatch(/KeyError/);
    expect(ids(checkResponse({ exec: true }, comm({ type: 'exec', uuid: 'u1' }, 'u1', [], 'RuntimeError: after send'), 'comm', {}))).toEqual(['comm.handler-raised']);
    const twice: CommResponse = { kind: 'comm', uuid: 'u1', replies: [{ content: { type: 'exec', uuid: 'u1' }, buffers: [] }, { content: { type: 'exec', uuid: 'u1' }, buffers: [] }] };
    expect(ids(checkResponse({ exec: true }, twice, 'comm', {}))).toEqual(['comm.surplus-reply']);
    expect(ids(checkResponse({ exec: true }, { kind: 'comm-timeout', after: 5 }, 'comm', {}))).toEqual(['comm.timeout']);
    expect(ids(checkResponse({ arrow: true }, comm({ type: 'arrow', uuid: 'u1' }, 'u1', []), 'comm', {}))).toEqual(['comm.buffers.0']);
    expect(ids(checkResponse({ exec: true }, comm({ type: 'exec', uuid: 'u1', rows: 3 }, 'u1'), 'comm', {}))).toEqual(['comm.schema.additional.rows']);
  });
});

describe('comm client', () => {
  const send = (c: CommClient, sql: string, uuid: string | undefined = `u-${sql}`, timeout?: number) =>
    c.send(uuid === undefined ? { type: 'arrow', sql } : { type: 'arrow', sql, uuid }, uuid, timeout);

  it('collects replies per invocation and associates out-of-order answers by invocation', async () => {
    const c = client();
    const [late, early] = await Promise.all([send(c, 'defer:80', 'late'), send(c, 'ok', 'early')]);
    expect(late).toMatchObject({ kind: 'comm', uuid: 'late', replies: [{ content: { type: 'arrow', uuid: 'late' } }] });
    expect(early).toMatchObject({ kind: 'comm', uuid: 'early', replies: [{ content: { type: 'arrow', uuid: 'early' } }] });
    expect((late as CommResponse).replies[0].buffers).toHaveLength(1);
  });

  it('collects every reply of an invocation and sends a manual request without a uuid unchanged', async () => {
    const c = client();
    expect(((await send(c, 'twice')) as CommResponse).replies).toHaveLength(2);
    expect(ids(checkResponse({ error: { code: 'bad_request' } }, await send(c, 'error', undefined), 'comm', {}))).toEqual([]);
  });

  it('keeps raised separate from replies and serves the next message after a raise', async () => {
    const c = client();
    expect(await send(c, 'raise')).toMatchObject({ kind: 'comm', replies: [], raised: "KeyError: 'uuid'" });
    expect(await send(c, 'reply-raise')).toMatchObject({ raised: 'RuntimeError: after send', replies: [{ content: { type: 'exec' } }] });
    expect(await send(c, 'silent')).toMatchObject({ kind: 'comm', replies: [] });
    expect((await send(c, 'silent') as CommResponse).raised).toBeUndefined();
    expect(await send(c, 'ok')).toMatchObject({ kind: 'comm', replies: [{ content: { type: 'arrow' } }] });
  });

  it('turns a deadline into comm-timeout and shim failures into rejections', async () => {
    expect(await send(client(), 'hang', 'h', 50)).toEqual({ kind: 'comm-timeout', after: 50 });
    await expect(send(client(), 'exit')).rejects.toThrow(/exited/);
    await expect(send(client(), 'garbage')).rejects.toThrow(/not JSON/);
    const dead = client();
    await send(dead, 'exit').catch(() => {});
    await expect(send(dead, 'ok')).rejects.toThrow(/exited/);
  });

  it('treats malformed or incomplete shim records as harness failures, never as replies', async () => {
    await expect(send(client(), 'not-done')).rejects.toThrow(/unknown kind "not-done"/);
    await expect(send(client(), 'null')).rejects.toThrow(/not an object/);
    await expect(send(client(), 'bad-buffers')).rejects.toThrow(/buffers are not base64/);
    await expect(send(client(), 'double-done')).rejects.toThrow(/done twice/);
    expect(parseShimRecord({ id: 1, kind: 'reply', content: {}, buffers: ['AQ=='] })).toMatchObject({ kind: 'reply' });
    expect(parseShimRecord({ id: 1, kind: 'done', raised: null })).toMatchObject({ kind: 'done' });
    expect(parseShimRecord({ id: 1, kind: 'done', raised: 5 })).toMatch(/non-string raised/);
    expect(parseShimRecord({ id: 'x', kind: 'done', raised: null })).toMatch(/integer id/);
    expect(parseShimRecord([])).toMatch(/not an object/);
  });

  it('surfaces a shim death once when several sends are outstanding, with no unhandled rejections', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    try {
      const c = client();
      const settled = await Promise.allSettled([send(c, 'defer:500', 'a'), send(c, 'defer:500', 'b'), send(c, 'exit', 'c')]);
      expect(settled.map(s => s.status)).toEqual(['rejected', 'rejected', 'rejected']);
      expect(String((settled[0] as PromiseRejectedResult).reason)).toMatch(/exited/);
      await new Promise(r => setTimeout(r, 50));
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});
