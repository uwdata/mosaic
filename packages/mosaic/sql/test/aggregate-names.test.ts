import { expect, describe, it } from 'vitest';
import { aggregateNames } from '../src/ast/aggregate.js';
import { queryFixture } from './util/validate.js';

// DuckDB reports these with function_type = 'aggregate', but they are
// deliberately absent from aggregateNames.
const omitted = new Set([
  // window-only functions: usable only with OVER, which
  // isAggregateExpression detects separately
  'cume_dist',
  'dense_rank',
  'fill',
  'first_value',
  'lag',
  'last_value',
  'lead',
  'nth_value',
  'ntile',
  'percent_rank',
  'rank',
  'rank_dense',
  'row_number',
  // internal optimizer variant of sum, not user-facing
  'sum_no_overflow'
]);

// Names in aggregateNames that DuckDB now implements as macros
// (function_type = 'macro'). The macros expand to aggregates, so
// classifying them as aggregates remains correct.
const macroBacked = new Set([
  'geomean',
  'geometric_mean',
  'histogram_values',
  'weighted_avg'
]);

describe('aggregateNames', () => {
  it('matches the aggregates in the fixture DuckDB', async () => {
    const rows = await queryFixture(`
      SELECT DISTINCT function_name
      FROM duckdb_functions()
      WHERE function_type = 'aggregate'
    `);
    const duckdb = new Set(rows.map(row => String(row.function_name)));

    const missing = Array.from(duckdb)
      .filter(name => !aggregateNames.includes(name) && !omitted.has(name))
      .sort();
    expect(
      missing,
      'DuckDB aggregates missing from aggregateNames; add these entries ' +
      `(or add them to the omitted set above): ${JSON.stringify(missing)}`
    ).toEqual([]);

    const removed = aggregateNames
      .filter(name => !duckdb.has(name) && !macroBacked.has(name))
      .sort();
    expect(
      removed,
      'aggregateNames entries no longer DuckDB aggregates; remove these ' +
      `(or add them to the macroBacked set above): ${JSON.stringify(removed)}`
    ).toEqual([]);
  });
});
