import { describe, it, expect } from 'vitest';
import { db } from './db.js';
import { parseServerArgs, queryHandler } from '../src/index.js';

describe('queryHandler', () => {
  it('rejects a request with no type', async () => {
    const errors = [];
    const res = { error: (err, code) => errors.push([String(err), code]) };
    await queryHandler(db)(res, JSON.stringify({ sql: 'SELECT 1' }));
    expect(errors).toEqual([['missing required \'type\' parameter', 400]]);
  });
});

describe('parseServerArgs', () => {
  it('defaults to an in-memory database on port 3000', () => {
    expect(parseServerArgs([])).toEqual({ dbPath: ':memory:', port: 3000 });
  });

  it('accepts a database path and a port in either order', () => {
    expect(parseServerArgs(['--port', '4010', 'data.db'])).toEqual({ dbPath: 'data.db', port: 4010 });
    expect(parseServerArgs(['data.db', '-p', '4010'])).toEqual({ dbPath: 'data.db', port: 4010 });
  });

  it('rejects a port that is not a valid number', () => {
    expect(() => parseServerArgs(['--port', 'abc'])).toThrow(/invalid --port/);
    expect(() => parseServerArgs(['--port', '70000'])).toThrow(/invalid --port/);
  });
});
