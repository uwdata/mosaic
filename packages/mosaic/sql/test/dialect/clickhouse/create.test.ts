import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, createSchema, createTable } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse createSchema overrides', () => {
  it('rewrites strict CREATE SCHEMA to CREATE DATABASE', () => {
    expect(createSchema('s1', { strict: true }).toString(gen)).toBe(
      `CREATE DATABASE "s1"`
    );
  });

  it('rewrites non-strict CREATE SCHEMA to CREATE DATABASE IF NOT EXISTS', () => {
    expect(createSchema('s1').toString(gen)).toBe(
      `CREATE DATABASE IF NOT EXISTS "s1"`
    );
  });
});

describe('ClickHouse createTable overrides', () => {
  it('uses TEMPORARY for temporary tables', () => {
    expect(createTable('t', 'SELECT 1', { temp: true }).toString(gen)).toBe(
      `CREATE TEMPORARY TABLE IF NOT EXISTS "t" AS SELECT 1`
    );
  });
});
