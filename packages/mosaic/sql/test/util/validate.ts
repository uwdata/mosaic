import { DuckDB } from '@uwdata/mosaic-duckdb';

/**
 * DuckDB-backed SQL validation helpers for the mosaic-sql test suite.
 *
 * These run generated SQL through DuckDB's parser + binder so that invalid SQL,
 * which string-equality assertions would happily accept, fails the test. A
 * single in-memory DuckDB instance is shared across the whole test run; each
 * assertion costs only an `EXPLAIN` call.
 *
 * ## Fixture schema
 *
 * Two identical tables, `t1` and `t2` (`t2` exists for joins and set
 * operations). Every column name encodes its type, and each name maps to
 * exactly one type.
 *
 * | column           | type        |
 * | ---------------- | ----------- |
 * | `num1` `num2` `num3` | `DOUBLE`    |
 * | `int1`           | `INTEGER`   |
 * | `txt1` `txt2`    | `VARCHAR`   |
 * | `ts1` `ts2`      | `TIMESTAMP` |
 * | `lst1` `lst2`    | `VARCHAR[]`  |
 * | `flag1` `flag2`  | `BOOLEAN`   |
 */
const COLUMNS: Record<string, string> = {
  num1: 'DOUBLE', num2: 'DOUBLE', num3: 'DOUBLE',
  int1: 'INTEGER',
  txt1: 'VARCHAR', txt2: 'VARCHAR',
  ts1: 'TIMESTAMP', ts2: 'TIMESTAMP',
  lst1: 'VARCHAR[]', lst2: 'VARCHAR[]',
  flag1: 'BOOLEAN', flag2: 'BOOLEAN'
};

const TABLES = ['t1', 't2'];

const columnDefs = Object.entries(COLUMNS)
  .map(([name, type]) => `"${name}" ${type}`)
  .join(', ');

async function createDB(): Promise<DuckDB> {
  const db = new DuckDB();
  for (const table of TABLES) {
    await db.exec(`CREATE TABLE ${table} (${columnDefs})`);
  }
  return db;
}

let dbPromise: Promise<DuckDB> | undefined;
const getDB = (): Promise<DuckDB> => (dbPromise ??= createDB());

/**
 * Validate a complete SQL statement against DuckDB's parser + binder.
 * Resolves if the statement is valid, rejects with the DuckDB error otherwise.
 * Uses EXPLAIN so the statement is bound (and, for SELECTs, optimized) without
 * materializing results.
 */
export async function validateQuery(
  sql: string | { toString(): string }
): Promise<void> {
  const db = await getDB();
  await db.exec(`EXPLAIN ${sql}`);
}

/**
 * Validate an expression fragment by wrapping it in a SELECT against the `t1`
 * fixture table. Resolves if valid, rejects with the DuckDB error otherwise.
 */
export async function validateExpr(
  expr: string | { toString(): string }
): Promise<void> {
  const db = await getDB();
  await db.exec(`EXPLAIN SELECT ${expr} FROM t1`);
}
