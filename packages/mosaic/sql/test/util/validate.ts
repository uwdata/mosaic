import { DuckDB } from '@uwdata/mosaic-duckdb';

/**
 * DuckDB-backed SQL validation helpers for the mosaic-sql test suite. These run
 * generated SQL through DuckDB's parser + binder so that invalid SQL that string
 * snapshots would happily bless is caught instead.
 *
 * A single in-memory DuckDB instance is shared across the whole test run; each
 * assertion only pays for a `prepare` (or `EXPLAIN`) call.
 *
 * Typed fixture tables let `validateExpr` bind a column name (e.g. `foo`) as a
 * number, date, string, etc. depending on the test. For full-statement
 * validation, every referenced table name is a VIEW over a single wide table so
 * the binder can resolve arbitrary `table.column` references.
 */

/** Column names that should be typed as numbers in the numeric fixture. */
const NUMERIC_COLUMNS = [
  'foo', 'bar', 'baz', 'bop', 'a', 'b', 'c', 'd', 'v', 'x', 'y',
  'amount', 'units', 'cost', 'min', 'max', 'value', 'expr', 'id',
  'colA', 'colB', 'colX', 'year'
];

/** Column names that should be typed as strings. */
const STRING_COLUMNS = ['foo', 'bar', 'baz', 's', 'quarter', 'region', 'segment', 'line', 'cat'];

/** Column names that should be typed as temporal values. */
const TEMPORAL_COLUMNS = ['foo', 'bar', 'baz', 'date_col', 'when'];

/** Column names that should be typed as lists. */
const LIST_COLUMNS = ['foo', 'bar', 'baz'];

/** Column names that should be typed as booleans. */
const BOOLEAN_COLUMNS = ['foo', 'bar', 'baz'];

/** Table names referenced by full-statement tests. */
const QUERY_TABLES = [
  'data', 'data1', 'data2', 'sales', 'raw_sales', 'source', 'cte',
  't', 'tab', 'table', 'other', 'A', 'B', 'X', 'Y', 'win', 'bar', 'foo'
];

export type FixtureTable = 'numerics' | 'dates' | 'strings' | 'lists' | 'booleans';

function columnDefs(names: string[], type: string): string {
  return names.map(n => `"${n}" ${type}`).join(', ');
}

/**
 * Build the DDL that sets up the shared fixture schema.
 */
function fixtureDDL(): string[] {
  // Wide table with every referenced column. Use types appropriate for the
  // pivot/group-by tests; most columns are numeric, a few are text/temporal.
  const wideNumeric = new Set([
    ...NUMERIC_COLUMNS, 'foo', 'bar', 'baz', 'bop'
  ]);
  const wideText = new Set(['quarter', 'region', 'segment', 's', 'line', 'cat']);
  const wideTemporal = new Set(['date_col', 'when']);
  const wideCols = new Set([
    ...NUMERIC_COLUMNS, ...STRING_COLUMNS, ...TEMPORAL_COLUMNS, 'value', 'expr'
  ]);

  const wideDefs = [...wideCols].map(name => {
    if (wideText.has(name)) return `"${name}" VARCHAR`;
    if (wideTemporal.has(name)) return `"${name}" TIMESTAMP`;
    if (wideNumeric.has(name)) return `"${name}" DOUBLE`;
    return `"${name}" DOUBLE`;
  }).join(', ');

  const ddl: string[] = [
    // Typed tables used by validateExpr.
    `CREATE TABLE numerics (${columnDefs(NUMERIC_COLUMNS, 'DOUBLE')})`,
    `CREATE TABLE dates (${columnDefs(TEMPORAL_COLUMNS, 'TIMESTAMP')})`,
    `CREATE TABLE strings (${columnDefs(STRING_COLUMNS, 'VARCHAR')})`,
    `CREATE TABLE lists (${columnDefs(LIST_COLUMNS, 'VARCHAR[]')})`,
    `CREATE TABLE booleans (${columnDefs(BOOLEAN_COLUMNS, 'BOOLEAN')})`,
    // Wide backing table used by full-statement validation.
    `CREATE TABLE __wide (${wideDefs})`
  ];

  // Create a view per referenced table name, all backed by __wide. Skip names
  // that collide with the typed fixture tables above.
  const reserved = new Set(['numerics', 'dates', 'strings', 'lists', 'booleans']);
  for (const name of QUERY_TABLES) {
    if (reserved.has(name)) continue;
    ddl.push(`CREATE VIEW "${name}" AS SELECT * FROM __wide`);
  }

  return ddl;
}

let dbPromise: Promise<DuckDB> | undefined;

/** Lazily initialize the shared in-memory DuckDB with the fixture schema. */
function getDB(): Promise<DuckDB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new DuckDB();
      await db._init;
      for (const stmt of fixtureDDL()) {
        await db.exec(stmt);
      }
      return db;
    })();
  }
  return dbPromise;
}

/**
 * Validate a complete SQL statement against DuckDB's parser + binder.
 * Resolves if the statement is valid, rejects with the DuckDB error otherwise.
 * Uses EXPLAIN so the statement is bound (and, for SELECTs, optimized) without
 * actually materializing results.
 */
export async function validateQuery(
  sql: string | { toString(): string }
): Promise<void> {
  const db = await getDB();
  await db.exec(`EXPLAIN ${sql}`);
}

/**
 * Validate an expression fragment by wrapping it in a SELECT against a fixture
 * table. Resolves if valid, rejects with the DuckDB error otherwise.
 *
 * @param expr the expression to validate
 * @param table which typed fixture table to bind column references against
 */
export async function validateExpr(
  expr: string | { toString(): string },
  table: FixtureTable = 'numerics'
): Promise<void> {
  const db = await getDB();
  await db.prepare(`SELECT ${expr} FROM "${table}"`);
}
