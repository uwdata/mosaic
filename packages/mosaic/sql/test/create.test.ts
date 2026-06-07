import { expect, describe, it } from 'vitest';
import { createSchema, createTable, CreateQuery, CreateSchemaQuery, isCreateQuery, isCreateSchemaQuery, Query } from '../src/index.js';

describe('CreateQuery', () => {
  it('is identifiable via isCreateQuery', () => {
    const q = createTable('table', 'SELECT 1');
    expect(q).toBeInstanceOf(CreateQuery);
    expect(isCreateQuery(q)).toBe(true);
  });

  it('exposes name, query, and options', () => {
    const q = createTable('table', 'SELECT 1', { temp: true, view: true });
    expect(q.name.name).toBe('table');
    expect(q.temp).toBe(true);
    expect(q.view).toBe(true);
    expect(q.replace).toBe(false);
  });

  it('accepts a Query node as query', () => {
    const select = Query.select('*').from('t');
    const q = new CreateQuery('table', select);
    expect(isCreateQuery(q)).toBe(true);
    expect(q.query).toBe(select);
  });

  it('is cloneable', () => {
    const q = createTable('table', 'SELECT 1', { temp: true });
    const c = q.clone();
    expect(c).not.toBe(q);
    expect(c.name).toBe(q.name);
    expect(c.query).toBe(q.query);
    expect(c.temp).toBe(q.temp);
  });
});

describe('createTable toString', () => {
  // CREATE statements are validated via EXPLAIN, which binds the statement
  // (and its SELECT source) without actually creating any objects.
  it('creates a table', async () => {
    await expect(createTable('table', 'SELECT 1')).toBeValidQuery(
      `CREATE TABLE IF NOT EXISTS "table" AS SELECT 1`
    );
  });

  it('creates a temp table', async () => {
    await expect(createTable('table', 'SELECT 1', { temp: true })).toBeValidQuery(
      `CREATE TEMP TABLE IF NOT EXISTS "table" AS SELECT 1`
    );
  });

  it('creates a table with replacement', async () => {
    await expect(createTable('table', 'SELECT 1', { replace: true })).toBeValidQuery(
      `CREATE OR REPLACE TABLE "table" AS SELECT 1`
    );
  });

  it('creates a view', async () => {
    await expect(createTable('view', 'SELECT 1', { view: true })).toBeValidQuery(
      `CREATE VIEW IF NOT EXISTS "view" AS SELECT 1`
    );
  });

  it('creates a temp view', async () => {
    await expect(createTable('view', 'SELECT 1', { temp: true, view: true })).toBeValidQuery(
      `CREATE TEMP VIEW IF NOT EXISTS "view" AS SELECT 1`
    );
  });

  it('creates a view with replacement', async () => {
    await expect(createTable('view', 'SELECT 1', { replace: true, view: true })).toBeValidQuery(
      `CREATE OR REPLACE VIEW "view" AS SELECT 1`
    );
  });

  it('generates SQL with a Query node as source', async () => {
    const q = createTable('result', Query.select('*').from('t'), { temp: true });
    await expect(q).toBeValidQuery(
      `CREATE TEMP TABLE IF NOT EXISTS "result" AS SELECT * FROM "t"`
    );
  });
});

describe('CreateSchemaQuery', () => {
  it('is identifiable via isCreateSchemaQuery', () => {
    const q = createSchema('s1');
    expect(q).toBeInstanceOf(CreateSchemaQuery);
    expect(isCreateSchemaQuery(q)).toBe(true);
  });

  it('exposes name and options', () => {
    const q = createSchema('s1', { strict: true });
    expect(q.name.name).toBe('s1');
    expect(q.strict).toBe(true);
  });

  it('is cloneable', () => {
    const q = createSchema('s1', { strict: true });
    const c = q.clone();
    expect(c).not.toBe(q);
    expect(c.name).toBe(q.name);
    expect(c.strict).toBe(q.strict);
  });
});

describe('createSchema toString', () => {
  it('creates a strict schema', async () => {
    await expect(createSchema('s1', { strict: true })).toBeValidQuery(
      `CREATE SCHEMA "s1"`
    );
  });

  it('creates a schema if it does not exist', async () => {
    await expect(createSchema('s1')).toBeValidQuery(
      `CREATE SCHEMA IF NOT EXISTS "s1"`
    );
  });
});
