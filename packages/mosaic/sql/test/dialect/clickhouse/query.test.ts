import { expect, describe, it } from 'vitest';
import {
  argmax,
  asof_join,
  clickHouseCodeGenerator,
  column,
  join,
  min,
  positional_join,
  Query
} from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse set operation overrides', () => {
  it('rewrites bare UNION as UNION DISTINCT', () => {
    const query = [
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
    ];
    expect(Query.union(...query).toString(gen))
      .toBe(query.map(q => q.toString(gen)).join(' UNION DISTINCT '));
  });

  it('preserves UNION ALL', () => {
    const query = [
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
    ];
    expect(Query.unionAll(...query).toString(gen))
      .toBe(query.map(q => q.toString(gen)).join(' UNION ALL '));
  });

  it('rejects BY NAME set operations', () => {
    const query = [
      Query.select('foo').from('data1'),
      Query.select('foo').from('data2')
    ];
    expect(() => Query.unionByName(...query).toString(gen))
      .toThrow(/UNION BY NAME is not supported/);
    expect(() => Query.unionAllByName(...query).toString(gen))
      .toThrow(/UNION ALL BY NAME is not supported/);
  });
});

describe('ClickHouse select-alias collision overrides', () => {
  it('rewrites SELECT when an alias collides', () => {
    const q = Query
      .select({
        power: argmax(column('power'), column('time_stamp')),
        time_stamp: min(column('time_stamp'))
      })
      .from('t')
      .groupby(column('time_stamp'));
    expect(q.toString(gen)).toBe(
      'SELECT "__clickhouse_alias_0" AS "power", "__clickhouse_alias_1" AS "time_stamp" '
      + 'FROM (SELECT argMax("power", "time_stamp") AS "__clickhouse_alias_0", '
      + 'min("time_stamp") AS "__clickhouse_alias_1" '
      + 'FROM "t" GROUP BY "time_stamp")'
    );
  });
});

describe('ClickHouse unsupported queries', () => {
  it('rejects pivot queries', () => {
    expect(() => Query.pivot('data').toString(gen))
      .toThrow(/PIVOT_QUERY is not supported/);
  });

  it('rejects sampling', () => {
    expect(() => Query.select('*').from('data').sample(10).toString(gen))
      .toThrow(/SAMPLE_CLAUSE is not supported/);
  });

  it('rejects percentage limits', () => {
    expect(() => Query.select('*').from('data').limitPercent(10).toString(gen))
      .toThrow(/LIMIT PERCENT is not supported/);
  });

  it('rejects unsupported joins', () => {
    expect(() => Query.select('*').from(positional_join('a', 'b')).toString(gen))
      .toThrow(/Positional joins are not supported/);
    expect(() => Query.select('*').from(asof_join('a', 'b', {
      type: 'RIGHT',
      using: ['x']
    })).toString(gen)).toThrow(/ASOF RIGHT joins are not supported/);
  });

  it('renders supported joins', () => {
    expect(Query.select('*').from(join('a', 'b', { using: ['x'] })).toString(gen))
      .toBe('SELECT * FROM "a" JOIN "b" USING ("x")');
    expect(Query.select('*').from(asof_join('a', 'b', {
      type: 'LEFT',
      using: ['x']
    })).toString(gen)).toBe('SELECT * FROM "a" ASOF LEFT JOIN "b" USING ("x")');
  });
});
