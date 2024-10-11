import { expect, describe, it } from 'vitest';
import { createSchema, createTable } from '../src/load/create.js';

describe('createTable', () => {
  it('creates a table', () => {
    expect(createTable('table', 'SELECT 1')).toBe(
      `CREATE TEMP TABLE IF NOT EXISTS table AS SELECT 1`
    );
  });
});

describe('createSchema', () => {
  it('creates a schema strict', () => {
    expect(createSchema('s1', { strict: true })).toBe(
      `CREATE SCHEMA s1`
    );
  });

  it('creates a schema if it does not exist', () => {
    expect(createSchema('s1')).toBe(
      `CREATE SCHEMA IF NOT EXISTS s1`
    );
  });
});
