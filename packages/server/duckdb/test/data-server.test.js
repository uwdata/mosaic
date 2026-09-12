import { describe, it, expect } from 'vitest';
import { db } from './db.js';
import { queryHandler } from '../src/index.js';

describe('queryHandler', () => {
  it('rejects a request with no type', async () => {
    const errors = [];
    const res = { error: (err, code) => errors.push([String(err), code]) };
    await queryHandler(db)(res, JSON.stringify({ sql: 'SELECT 1' }));
    expect(errors).toEqual([[`missing required 'type' parameter`, 400]]);
  });
});
