import { describe, it, expect } from 'vitest';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import type { JSType } from '../src/index.js';
import { jsType } from '../src/index.js';

const cases: [string, string, JSType][] = [
  ['NULL', '"NULL"', 'null'],
  ['1::TINYINT', 'TINYINT', 'number'],
  ['1::SMALLINT', 'SMALLINT', 'number'],
  ['1::INTEGER', 'INTEGER', 'number'],
  ['1::BIGINT', 'BIGINT', 'number'],
  ['1::HUGEINT', 'HUGEINT', 'number'],
  ['1::UTINYINT', 'UTINYINT', 'number'],
  ['1::USMALLINT', 'USMALLINT', 'number'],
  ['1::UINTEGER', 'UINTEGER', 'number'],
  ['1::UBIGINT', 'UBIGINT', 'number'],
  ['1.5::FLOAT', 'FLOAT', 'number'],
  ['1.5::DOUBLE', 'DOUBLE', 'number'],
  ['1.5::DECIMAL(10,2)', 'DECIMAL(10,2)', 'number'],
  ['DATE \'2020-01-01\'', 'DATE', 'date'],
  ['TIMESTAMP \'2020-01-01\'', 'TIMESTAMP', 'date'],
  ['TIMESTAMPTZ \'2020-01-01\'', 'TIMESTAMP WITH TIME ZONE', 'date'],
  ['\'2020-01-01\'::TIMESTAMP_MS', 'TIMESTAMP_MS', 'date'],
  ['\'2020-01-01\'::TIMESTAMP_NS', 'TIMESTAMP_NS', 'date'],
  ['TIME \'01:00\'', 'TIME', 'date'],
  ['true', 'BOOLEAN', 'boolean'],
  ['\'x\'', 'VARCHAR', 'string'],
  ['uuid()', 'UUID', 'string'],
  ['\'a\'::ENUM(\'a\', \'b\')', 'ENUM(\'a\', \'b\')', 'string'],
  ['\'x\'::BLOB', 'BLOB', 'object'],
  ['[1, 2]', 'INTEGER[]', 'array'],
  ['[1, 2]::INTEGER[2]', 'INTEGER[2]', 'array'],
  ['[NULL]', '"NULL"[]', 'array'],
  ['{\'a\': 1}', 'STRUCT(a INTEGER)', 'object'],
  ['{\'a\': NULL}', 'STRUCT(a "NULL")', 'object'],
  ['MAP {\'a\': 1}', 'MAP(VARCHAR, INTEGER)', 'object']
];

describe('jsType', () => {
  it('maps SQL type names to JavaScript types', () => {
    for (const [, sqlType, type] of cases) {
      expect(jsType(sqlType), sqlType).toBe(type);
    }
    expect(jsType('TIMESTAMPTZ')).toBe('date');
    expect(jsType('JSON')).toBe('string');
    expect(jsType('GEOMETRY')).toBe('object');
  });

  it('throws on unsupported types', () => {
    expect(() => jsType('INTERVAL')).toThrow('Unsupported type: INTERVAL');
  });

  it('matches the type names reported by DuckDB', async () => {
    const db = new DuckDB();
    try {
      const select = cases.map(([expr], i) => `${expr} AS c${i}`).join(', ');
      const rows = await db.query(`DESCRIBE SELECT ${select}`);
      expect(rows.map(row => row.column_type)).toEqual(cases.map(c => c[1]));
    } finally {
      db.close();
    }
  });
});
