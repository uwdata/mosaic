import { beforeAll, describe, expect, it } from 'vitest';
import {
  Query,
  WindowFunctionNode,
  WindowNode,
  argmax,
  argmin,
  asof_join,
  bitAnd,
  bitLeft,
  bitNot,
  bitOr,
  bitRight,
  cast,
  clickHouseCodeGenerator,
  column,
  contains,
  count,
  createTable,
  dateBin,
  dateMonth,
  desc,
  epoch_ms,
  frameRows,
  geomean,
  gt,
  idiv,
  isFinite,
  isInfinite,
  isNaN,
  join,
  lag,
  lead,
  list,
  listContains,
  listHasAll,
  listHasAny,
  literal,
  log,
  mad,
  min,
  mode,
  nth_value,
  pow,
  prefix,
  product,
  quantile,
  regrAvgX,
  regrAvgY,
  regrCount,
  regrIntercept,
  regrR2,
  regrSlope,
  regrSXX,
  regrSXY,
  regrSYY,
  regexp_matches,
  sql,
  sum,
  suffix,
  timezone,
  unnest,
} from '../../../src/index.js';
import {
  clickHouseLocalVersion,
  executeClickHouseLocal,
  queryClickHouseLocal
} from '../../util/clickhouse-local.js';

const enabled = process.env.CLICKHOUSE_LOCAL === '1';
const gen = clickHouseCodeGenerator;
const query = (value: { toString(generator: typeof gen): string }) =>
  queryClickHouseLocal(value.toString(gen));

describe.skipIf(!enabled)('ClickHouse execution', { timeout: 15_000 }, () => {
  beforeAll(async () => {
    const version = await clickHouseLocalVersion();
    console.info(`Testing with ClickHouse Local ${version}`);
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  }, 15_000);

  it('executes numeric and bitwise expressions', async () => {
    const result = await query(Query.select({
      power: pow(2, 3),
      quotient: idiv(7, 2),
      masked: bitAnd(6, 3)
    }));
    expect(result).toEqual([{ power: 8, quotient: 3, masked: 2 }]);
  });

  it('executes bitwise shifts, complement, and casts', async () => {
    const result = await query(Query.select({
      complemented: bitNot(bitNot(5)),
      combined: bitOr(4, 1),
      shiftedLeft: bitLeft(3, 2),
      shiftedRight: bitRight(12, 2),
      castValue: cast(literal('42'), 'Int32')
    }));
    expect(result).toEqual([{
      complemented: 5,
      combined: 5,
      shiftedLeft: 12,
      shiftedRight: 3,
      castValue: 42
    }]);
  });

  it('executes string and list predicates', async () => {
    const result = await query(Query.select({
      contains: contains(literal('alphabet'), 'pha'),
      regexp: regexp_matches(literal('alphabet'), '^alpha'),
      list: listContains([1, 2, 3], 2)
    }));
    expect(result).toEqual([{ contains: 1, regexp: 1, list: 1 }]);
  });

  it('executes string, list, and numeric functions', async () => {
    const nan = cast(literal('nan'), 'Float64');
    const inf = cast(literal('inf'), 'Float64');
    const result = await query(Query.select({
      prefix: prefix(literal('alphabet'), 'alpha'),
      suffix: suffix(literal('alphabet'), 'bet'),
      any: listHasAny(list([1, 2, 3]), list([3, 4])),
      all: listHasAll(list([1, 2, 3]), list([1, 3])),
      nan: isNaN(nan),
      infinite: isInfinite(inf),
      finite: isFinite(literal(1.5)),
      logarithm: log(100)
    }));
    expect(result).toEqual([{
      prefix: 1,
      suffix: 1,
      any: 1,
      all: 1,
      nan: 1,
      infinite: 1,
      finite: 1,
      logarithm: 2
    }]);
  });

  it('unnests lists', async () => {
    const result = await query(Query.select({
      value: unnest(list([1, 2, 3]))
    }));
    expect(result).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });

  it('executes filtered and distinct aggregates', async () => {
    const source = sql`values('x Int32, keep Bool', (1, true), (2, false), (3, true))`;
    const result = await query(Query
      .select({
        total: sum('x').where('keep'),
        distinct: count('x').distinct()
      })
      .from(source));
    expect(result).toEqual([{ total: 4, distinct: 3 }]);
  });

  it('executes rewritten and combined aggregates', async () => {
    const source = sql`
      values(
        'x Int32, score Int32, keep Bool',
        (2, 10, true),
        (2, 20, true),
        (3, 30, true),
        (4, 40, false)
      )
    `;
    const result = await query(Query
      .select({
        argmax: argmax('x', 'score').where('keep'),
        argmin: argmin('x', 'score').where('keep'),
        mode: mode('x').where('keep'),
        product: product('x').where('keep'),
        distinctProduct: product('x').distinct().where('keep'),
        mad: mad('x').where('keep'),
        distinctCount: count('x').distinct().where('keep')
      })
      .from(source));
    expect(result).toEqual([{
      argmax: 3,
      argmin: 2,
      mode: 2,
      product: 12,
      distinctProduct: 6,
      mad: 0,
      distinctCount: 2
    }]);
  });

  it('executes geometric means', async () => {
    const source = sql`values('x Float64', 1, 4)`;
    const [{ value }] = await query(Query
      .select({ value: geomean('x') })
      .from(source));
    expect(value).toBeCloseTo(2);
  });

  it('executes filtered regressions with null-pair exclusion', async () => {
    const source = sql`
      values(
        'x Nullable(Float64), y Nullable(Float64), keep Bool',
        (1, 3, true),
        (2, 5, true),
        (3, 7, true),
        (NULL, 9, true),
        (4, NULL, true),
        (4, 100, false)
      )
    `;
    const result = await query(Query
      .select({
        count: regrCount('y', 'x').where('keep'),
        avgx: regrAvgX('y', 'x').where('keep'),
        avgy: regrAvgY('y', 'x').where('keep'),
        sxx: regrSXX('y', 'x').where('keep'),
        syy: regrSYY('y', 'x').where('keep'),
        sxy: regrSXY('y', 'x').where('keep'),
        slope: regrSlope('y', 'x').where('keep'),
        intercept: regrIntercept('y', 'x').where('keep'),
        r2: regrR2('y', 'x').where('keep')
      })
      .from(source));
    expect(result).toEqual([{
      count: 3,
      avgx: 2,
      avgy: 5,
      sxx: 2,
      syy: 8,
      sxy: 4,
      slope: 2,
      intercept: 1,
      r2: 1
    }]);
  });

  it('executes parameterized quantiles', async () => {
    const source = sql`values('x Int32', 1, 2, 3, 4)`;
    const result = await query(Query
      .select({ median: quantile('x', 0.5) })
      .from(source));
    expect(result).toEqual([{ median: 2 }]);
  });

  it('preserves null window defaults', async () => {
    const source = sql`values('x Int32', 1, 2, 3)`;
    const result = await query(Query
      .select('x', {
        previous: lag('x').orderby('x'),
        next: lead('x').orderby('x'),
        fourth: nth_value('x', 4)
          .orderby('x')
          .frame(frameRows([null, null]))
      })
      .from(source)
      .orderby('x'));
    expect(result).toEqual([
      { x: 1, previous: null, next: 2, fourth: null },
      { x: 2, previous: 1, next: 3, fourth: null },
      { x: 3, previous: 2, next: null, fourth: null }
    ]);
  });

  it('preserves explicit lag and lead defaults', async () => {
    const source = sql`values('x Int32', 1, 2, 3)`;
    const result = await query(Query
      .select('x', {
        previous: lag('x', 1, literal(-1)).orderby('x'),
        next: lead('x', 1, literal(99)).orderby('x')
      })
      .from(source)
      .orderby('x'));
    expect(result).toEqual([
      { x: 1, previous: -1, next: 2 },
      { x: 2, previous: 1, next: 3 },
      { x: 3, previous: 2, next: 99 }
    ]);
  });

  it('executes ignore-nulls window functions', async () => {
    const source = sql`
      values(
        'i Int32, x Nullable(Int32)',
        (1, NULL),
        (2, 2),
        (3, NULL)
      )
    `;
    const first = new WindowNode(new WindowFunctionNode(
      'first_value',
      [column('x')],
      true
    ))
      .orderby('i')
      .frame(frameRows([null, null]));
    const result = await query(Query
      .select('i', { first })
      .from(source)
      .orderby('i'));
    expect(result).toEqual([
      { i: 1, first: 2 },
      { i: 2, first: 2 },
      { i: 3, first: 2 }
    ]);
  });

  it('executes set operations', async () => {
    const result = await query(Query
      .union(
        Query.select({ value: literal(1) }),
        Query.select({ value: literal(1) }),
        Query.select({ value: literal(2) })
      )
      .orderby('value'));
    expect(result).toEqual([{ value: 1 }, { value: 2 }]);
  });

  it('preserves ordering and limits through alias collision rewrites', async () => {
    const source = sql`values('x Int32', 3, 1, 2)`;
    const result = await query(Query
      .select({ x: min('x') })
      .from(source)
      .groupby('x')
      .orderby(desc('x'))
      .limit(2));
    expect(result).toEqual([{ x: 3 }, { x: 2 }]);
  });

  it('executes alias collision rewrites in having clauses', async () => {
    const source = sql`values('x Int32', 1, 2, 3)`;
    const result = await query(Query
      .select({ x: min('x') })
      .from(source)
      .groupby('x')
      .having(gt('x', 1))
      .orderby('x'));
    expect(result).toEqual([{ x: 2 }, { x: 3 }]);
  });

  it('executes regular joins', async () => {
    const result = await query(Query
      .with({
        left_data: Query.select({
          id: literal(1),
          leftValue: literal('left')
        }),
        right_data: Query.select({
          id: literal(1),
          rightValue: literal('right')
        })
      })
      .select('id', 'leftValue', 'rightValue')
      .from(join('left_data', 'right_data', { using: ['id'] })));
    expect(result).toEqual([{
      id: 1,
      leftValue: 'left',
      rightValue: 'right'
    }]);
  });

  it('executes as-of joins', async () => {
    const result = await query(Query
      .with({
        trades: Query.select({ id: literal(1), ts: literal(15) }),
        quotes: Query.unionAll(
          Query.select({
            id: literal(1),
            ts: literal(10),
            price: literal(100)
          }),
          Query.select({
            id: literal(1),
            ts: literal(20),
            price: literal(200)
          })
        )
      })
      .select({
        id: column('id', 'trades'),
        ts: column('ts', 'trades'),
        price: column('price', 'quotes')
      })
      .from(asof_join('trades', 'quotes', {
        type: 'LEFT',
        using: ['id', 'ts']
      })));
    expect(result).toEqual([{ id: 1, ts: 15, price: 100 }]);
  });

  it('executes temporary table creation', async () => {
    const create = createTable(
      'mosaic_clickhouse_test',
      Query.select({ value: literal(1) }),
      { temp: true }
    );
    await executeClickHouseLocal(create.toString(gen));
  });

  it('executes datetime rewrites', async () => {
    const date = new Date('2024-01-02T03:04:05.678Z');
    const result = await query(Query.select({
      bucket: dateBin(literal(date), 'hour'),
      epoch: epoch_ms(literal(date)),
      localTime: timezone('America/Los_Angeles', literal(date)),
      month: dateMonth(literal(date))
    }));
    expect(result).toEqual([{
      bucket: '2024-01-02 03:00:00.000',
      epoch: +date,
      localTime: '2024-01-01 19:04:05.678',
      month: '2012-01-01'
    }]);
  });
});
