import { describe, it, expect } from 'vitest';
import { db } from './db.js';
import { queryHandler } from '../src/index.js';

describe('queryHandler', () => {
  it('rejects a request with no type', async () => {
    const errors = [];
    const res = { error: (err, code) => errors.push([String(err), code]) };
    await queryHandler(db)(res, JSON.stringify({ sql: 'SELECT 1' }));
    expect(errors).toEqual([['missing required \'type\' parameter', 400]]);
  });

  it('materializes a preagg request into the mosaic schema', async () => {
    const responses = [];
    const res = { json: data => responses.push(data), error: err => { throw err; } };
    const request = JSON.stringify({ type: 'preagg', sql: 'SELECT 42 AS answer' });
    await queryHandler(db)(res, request);
    await queryHandler(db)(res, request);
    const [{ reference }, second] = responses;
    expect(reference).toEqual(['memory', 'mosaic', expect.stringMatching(/^preagg_[0-9a-f]{16}$/)]);
    expect(second.reference).toEqual(reference);
    expect(Date.parse(second.createdAt)).not.toBeNaN();
    expect(await db.query(`SELECT answer FROM mosaic."${reference[2]}"`)).toEqual([{ answer: 42 }]);
  });
});
