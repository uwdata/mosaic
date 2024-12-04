import { expect, describe, it } from 'vitest';
import { createSchema, createTable } from '../src/index.js';

describe('createTable', () => {
  it('creates a table', () => {
    expect(createTable('table', 'SELECT 1')).toBe(
      `CREATE TABLE IF NOT EXISTS table AS SELECT 1`
    );
  });

  it('creates a temp table', () => {
    expect(createTable('table', 'SELECT 1', { temp: true })).toBe(
      `CREATE TEMP TABLE IF NOT EXISTS table AS SELECT 1`
    );
  });

  it('creates a table with replacement', () => {
    expect(createTable('table', 'SELECT 1', { replace: true })).toBe(
      `CREATE OR REPLACE TABLE table AS SELECT 1`
    );
  });

  it('creates a view', () => {
    expect(createTable('view', 'SELECT 1', { view: true })).toBe(
      `CREATE VIEW IF NOT EXISTS view AS SELECT 1`
    );
  });

  it('creates a temp view', () => {
    expect(createTable('view', 'SELECT 1', { temp: true, view: true })).toBe(
      `CREATE TEMP VIEW IF NOT EXISTS view AS SELECT 1`
    );
  });

  it('creates a table with replacement', () => {
    expect(createTable('view', 'SELECT 1', { replace: true, view: true })).toBe(
      `CREATE OR REPLACE VIEW view AS SELECT 1`
    );
  });
});

describe('createSchema', () => {
  it('creates a strict schema', () => {
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
