import { describe, it, expect } from 'vitest';
import type { CreateQuery, ExprNode, FilterExpr, ScaleOptions } from '@uwdata/mosaic-sql';
import { Query, add, argmax, argmin, avg, columns, corr, count, covarPop, covariance, cpcEstimate, cpcSketch, cte, desc, eq, filterPushdown, geomean, gt, hllEstimate, hllSketch, hllUnion, kllQuantile, kllSketch, literal, loadObjects, max, median, min, mul, neq, product, quantile, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSXX, regrSXY, regrSYY, regrSlope, sql, stddev, stddevPop, sum, upper, varPop, variance } from '@uwdata/mosaic-sql';
import { clauseComposite, clauseInterval, clauseIntervals, clausePoint, type CompositeMetadata, Coordinator, Param, Selection, SelectionClause } from '../src/index.js';
import type { PreAggregateInfo, PreAggregateMode, PreAggregateOptions } from '../src/preagg/PreAggregator.js';
import { preaggColumns } from '../src/preagg/preagg-columns.js';
import { NodeConnector } from '../src/connectors/NodeConnector.js';
import { TestClient } from './util/test-client.js';

type Datum = { measure: number };
type RunMeasure = ExprNode | ((predicate?: FilterExpr) => Query);

const loadQuery = loadObjects('testData', [
  { dim: 'a', cat: 'c', order: 1, x: 1, y: 9 },
  { dim: 'a', cat: 'c', order: 2, x: 2, y: 8 },
  { dim: 'b', cat: 'd', order: 1, x: 3, y: 7 },
  { dim: 'b', cat: 'd', order: 2, x: 4, y: 6 },
  { dim: 'b', cat: 'd', order: 3, x: null, y: null }
]);

const modes: PreAggregateMode[] = ['exec', 'preagg'];

/**
 * Create test helpers whose coordinators pre-aggregate in the given mode.
 * In 'preagg' mode the NodeConnector materializes the table itself.
 * @param mode The pre-aggregation mode.
 */
function harness(mode: PreAggregateMode) {
  async function setup(loadQuery: CreateQuery | string, preagg?: PreAggregateOptions) {
    const mc = new Coordinator(await NodeConnector.make(), {
      logger: null,
      cache: false,
      consolidate: false,
      preagg: { mode, ...preagg }
    });
    await mc.exec(loadQuery);
    return mc;
  }

  /**
   * Query the test dataset with the given measure, filtered by the clause.
   * @param measure The aggregate measure or query function for the client.
   * @param clause The selection clause to apply.
   * @param preagg Pre-aggregation options.
   * @param load Data loading query.
   * @returns The measure value, the pre-aggregation entry (if any),
   *  and the coordinator.
   */
  async function runQuery(
    measure: RunMeasure,
    clause: SelectionClause,
    preagg?: PreAggregateOptions,
    load: CreateQuery | string = loadQuery
  ) {
    const mc = await setup(load, preagg);
    const sel = Selection.single({ cross: true });

    return new Promise<{ value: number, info?: PreAggregateInfo, mc: Coordinator }>((resolve, reject) => {
      let iter = 0;
      const client = new TestClient(null, sel, {
        query(filter = []) {
          return typeof measure === 'function'
            ? measure(filter)
            : Query.from('testData').select({ measure }).where(filter);
        },
        queryResult(data: unknown) {
          if (iter) {
            resolve({
              value: (Array.from(data as Iterable<Datum>))[0].measure,
              info: mc.preaggregator.entries.get(client) as PreAggregateInfo | undefined,
              mc
            });
          }
          ++iter;
          return this;
        },
        queryError(err: Error) {
          console.error('QUERY ERROR', err);
          reject(err);
        }
      });
      mc.connect(client);
      client.pending.then(() => sel.update(clause)).catch(err => {
        console.error(err);
      });
    });
  }

  /**
   * Query the test dataset with the given measure, filtered by a point
   * selection on dim = 'b'.
   * @param measure The aggregate measure or query function for the client.
   * @returns The measure value and whether pre-aggregation was applied.
   */
  async function run(measure: RunMeasure): Promise<[number, boolean]> {
    const { value, info } = await runQuery(measure, clausePoint('dim', 'b', { source: {} }));
    return [value, !!info];
  }

  return { setup, runQuery, run };
}

describe.each(modes)('PreAggregator (%s mode)', mode => {
  const { run, runQuery } = harness(mode);

  it('materializes into the table the mode assigns', async () => {
    const { info } = await runQuery(sum('x'), clausePoint('dim', 'b', { source: {} }));
    const name = expect.stringMatching(/^preagg_[0-9a-f]+$/);
    expect(info!.table!.table).toEqual(mode === 'exec' ? ['mosaic', name] : ['temp', 'main', name]);
  });

  it('supports count aggregate', async () => {
    expect(await run(count())).toStrictEqual([3, true]);
    expect(await run(count('x'))).toStrictEqual([2, true]);
  });

  it('supports empty count aggregate', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: count() })
        .where(predicate, false);
    };
    expect(await run(query)).toStrictEqual([0, true]);
  });

  it('supports sum aggregate', async () => {
    expect(await run(sum('x'))).toStrictEqual([7, true]);
  });

  it('supports avg aggregate', async () => {
    expect(await run(avg('x'))).toStrictEqual([3.5, true]);
  });

  it('supports geomean aggregate', async () => {
    const [result, optimized] = await run(geomean('x'));

    expect(result).toBeCloseTo(Math.sqrt(12), 10);
    expect(optimized).toBe(true);
  });

  it('supports min aggregate', async () => {
    expect(await run(min('x'))).toStrictEqual([3, true]);
  });

  it('supports max aggregate', async () => {
    expect(await run(max('x'))).toStrictEqual([4, true]);
  });

  it('supports product aggregate', async () => {
    expect(await run(product('x'))).toStrictEqual([12, true]);
  });

  it('supports argmax aggregate', async () => {
    expect(await run(argmax('dim', 'x'))).toStrictEqual(['b', true]);
  });

  it('supports argmin aggregate', async () => {
    expect(await run(argmin('dim', 'x'))).toStrictEqual(['b', true]);
  });

  it('supports variance aggregate', async () => {
    expect(await run(variance('x'))).toStrictEqual([0.5, true]);
  });

  it('supports varPop aggregate', async () => {
    expect(await run(varPop('x'))).toStrictEqual([0.25, true]);
  });

  it('supports stddev aggregate', async () => {
    expect(await run(stddev('x'))).toStrictEqual([Math.sqrt(0.5), true]);
  });

  it('supports stddevPop aggregate', async () => {
    expect(await run(stddevPop('x'))).toStrictEqual([Math.sqrt(0.25), true]);
  });

  it('supports covariance aggregate', async () => {
    expect(await run(covariance('x', 'y'))).toStrictEqual([-0.5, true]);
    expect(await run(covariance('y', 'x'))).toStrictEqual([-0.5, true]);
  });

  it('supports covarPop aggregate', async () => {
    expect(await run(covarPop('x', 'y'))).toStrictEqual([-0.25, true]);
    expect(await run(covarPop('y', 'x'))).toStrictEqual([-0.25, true]);
  });

  it('supports corr aggregate', async () => {
    expect(await run(corr('x', 'y'))).toStrictEqual([-1, true]);
    expect(await run(corr('y', 'x'))).toStrictEqual([-1, true]);
  });

  it('supports regression aggregates', async () => {
    expect(await run(regrCount('y', 'x'))).toStrictEqual([2, true]);
    expect(await run(regrAvgX('y', 'x'))).toStrictEqual([3.5, true]);
    expect(await run(regrAvgY('y', 'x'))).toStrictEqual([6.5, true]);
    expect(await run(regrSXX('y', 'x'))).toStrictEqual([0.5, true]);
    expect(await run(regrSYY('y', 'x'))).toStrictEqual([0.5, true]);
    expect(await run(regrSXY('y', 'x'))).toStrictEqual([-0.5, true]);
    expect(await run(regrSlope('y', 'x'))).toStrictEqual([-1, true]);
    expect(await run(regrIntercept('y', 'x'))).toStrictEqual([10, true]);
    expect(await run(regrR2('y', 'x'))).toStrictEqual([1, true]);
  });

  it('supports multi-aggregate expressions', async () => {
    expect(await run(add(sum('x'), product('x')))).toStrictEqual([19, true]);
  });

  it('supports aggregate filter clause', async () => {
    expect(await run(sum('x').where(gt('x', 2)))).toStrictEqual([7, true]);
    expect(await run(sum('x').where(gt('x', 3)))).toStrictEqual([4, true]);
    expect(await run(sum('x').where(gt('x', 4)))).toStrictEqual([null, true]);
  });

  it('does not support distinct aggregates', async () => {
    // should handle query, but through non-optimized route
    expect(await run(count('x').distinct())).toStrictEqual([2, false]);
  });

  it('supports subqueries with aggregates', async () => {
    const query = (predicate: FilterExpr = []) => {
      const counts = Query.from('testData')
        .select({ item: 'x', freq: count() })
        .groupby('x')
        .where(predicate);
      return Query.with({ counts })
        .from('counts')
        .select({ measure: sum(mul(2, 'freq')) });
    };
    expect(await run(query)).toStrictEqual([6, true]);

    const queryNoGroup = (predicate: FilterExpr = []) => {
      const counts = Query.from('testData')
        .select({ freq: count() })
        .where(predicate);
      return Query.with({ counts })
        .from('counts')
        .select({ measure: add(1, sum('freq')) });
    };
    expect(await run(queryNoGroup)).toStrictEqual([4, true]);
  });

  it('supports queries with column index references', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), dim: 'dim' })
        .groupby(literal(2))
        .where(predicate)
        .orderby(desc(literal(1)))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports queries with aggregate order by expressions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), dim: 'dim' })
        .groupby('dim')
        .where(predicate)
        .orderby(sum('y'))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports queries with window functions with aggregate inputs', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: sum(sum('y')).orderby('order') })
        .groupby('dim', 'order')
        .where(predicate)
        .qualify(gt('measure', 7));
    };
    expect(await run(query)).toStrictEqual([13, true]);
  });

  it('supports queries with having clause', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: sum('y') })
        .groupby('dim')
        .where(predicate)
        .having(gt(avg('x'), 2));
    };
    expect(await run(query)).toStrictEqual([13, true]);
  });

  it('supports queries with qualify clause containing an aggregate', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: sum(sum('y')).orderby('order') })
        .groupby('dim', 'order')
        .where(predicate)
        .qualify(gt('measure', 7), gt(avg('x'), 0));
    };
    expect(await run(query)).toStrictEqual([13, true]);
  });

  it('supports queries with filter pushdown applied', async () => {
    const query = (predicate: FilterExpr = []) => {
      // include a non-selective clause to ensure that we always have
      // a "pushed-down" query input to preaggregation.
      const filter = [neq('dim', literal('c')), predicate].flat();
      const q = Query.from('testData')
        .select({ measure: avg('x'), dim: 'dim' })
        .groupby('dim');
      return filterPushdown(q, 'testData', filter);
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports queries with params', async () => {
    const p = Param.value(2);
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: sum(sql`"x" * ${p}`) })
        .where(predicate);
    };
    expect(await run(query)).toStrictEqual([14, true]);
  });

  it('supports queries with renamed groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), Cat: 'cat' })
        .groupby('cat')
        .where(predicate)
        .orderby(desc('measure'))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports queries with expression-valued groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), Cat: 'cat' })
        .groupby('Cat', upper('cat'))
        .where(predicate)
        .orderby(desc('measure'))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports expression-valued selection fields', async () => {
    const size = sql`CASE WHEN "x" > 2 THEN 'big' ELSE 'small' END`;
    const clause = clausePoint(size, 'big', { source: {} });
    const { value, info, mc } = await runQuery(sum('x'), clause);
    expect(value).toBe(7);

    // one preaggregate row per expression value ('big', 'small')
    const rows = await mc.query(Query.from(info!.table!).select({ n: count() }));
    expect(rows.get(0).n).toBe(2);
  });

  it('supports case-insensitive collisions among groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x') })
        .groupby('cat', 'CAT')
        .where(predicate)
        .orderby(desc('measure'))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports duplicate groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x') })
        .groupby('cat', 'cat')
        .where(predicate)
        .orderby(desc('measure'))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('dedupes case-insensitive collisions among groupby dimensions', () => {
    const query = Query.from('testData')
      .select({ measure: avg('x') })
      .groupby('cat', 'CAT');
    const cols = preaggColumns(new TestClient(query));
    expect(cols?.groupby).toStrictEqual(['cat']);
  });

  it('dedupes duplicate groupby dimensions', () => {
    const query = Query.from('testData')
      .select({ measure: avg('x') })
      .groupby('cat', 'cat');
    const cols = preaggColumns(new TestClient(query));
    expect(cols?.groupby).toStrictEqual(['cat']);
  });

  it('supports grouping column pushdown', async () => {
     const query = (predicate: FilterExpr = []) => {
      return Query.from(
          Query
            .with({
              level2: Query.unionAll([
                Query.from('testData').select({ v: 'x', u: 'cat' }).where(eq('cat', literal('c')), predicate),
                Query.from('testData').select({ v: 'x', u: 'cat' }).where(eq('cat', literal('d')), predicate)
              ]),
              level1: Query.from('level2').select('u', 'v')
            })
            .from('level1')
            .select({ value: add('v', 1), type: 'u' })
        )
        .select({
          measure: avg('value'), type: 'type'
        })
        .groupby('type');
    };
    expect(await run(query)).toStrictEqual([4.5, true]);

    const query2 = (predicate: FilterExpr = []) => {
      return Query.from(
          Query
            .with(
              cte('level2', Query.unionAll([
                Query.from('testData').select({ v: 'x', u: 'cat' }).where(eq('cat', literal('c')), predicate),
                Query.from('testData').select({ v: 'x', u: 'cat' }).where(eq('cat', literal('d')), predicate)
              ])),
              cte('level1', Query.from('level2').select('u', 'v'))
            )
            .from('level1')
            .select({ value: add('v', 1), type: 'u' })
        )
        .select({
          measure: avg('value'), type: 'type'
        })
        .groupby('type');
    };
    expect(await run(query2)).toStrictEqual([4.5, true]);
  });

  it('supports grouping column pushdown into positional set operation inputs', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query
        .with({
          r: Query.from('testData').select('dim', 'x', 'y').where(predicate),
          s: Query.unionAll([
            Query.from('r').select({ series: 'dim', v: 'x' }),
            Query.from('r').select('dim', 'y')
          ])
        })
        .from('s')
        .select({ measure: sum('v') });
    };
    expect(await run(query)).toStrictEqual([20, true]);
  });

  it('does not support grouping column pushdown into set operations with star inputs', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query
        .from(Query.unionAll([
          Query.from('testData').select({ d: 'cat' }, 'cat', 'order', 'x', 'y'),
          Query.from('testData').select('*').where(predicate)
        ]))
        .select({ measure: sum('x') });
    };
    expect(await run(query)).toStrictEqual([17, false]);
  });

  it('does not support grouping column pushdown into COLUMNS subqueries', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query
        .from(Query.from('testData').select(columns('^[xy]$')).where(predicate))
        .select({ measure: sum('x') });
    };
    expect(await run(query)).toStrictEqual([7, false]);
  });

  it('supports mean-centered aggregates over derived columns', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query
        .with({
          derived: Query.from('testData').select({ v: 'x' }).where(predicate)
        })
        .from('derived')
        .select({ measure: variance('v') });
    };
    expect(await run(query)).toStrictEqual([0.5, true]);
  });
});

describe.each(modes)('PreAggregator selection clauses (%s mode)', mode => {
  const { runQuery } = harness(mode);
  const linear = (domain: [number, number]): ScaleOptions => (
    { type: 'linear', domain, range: [0, 100] }
  );

  it('supports interval clauses', async () => {
    const clause = clauseIntervals(['x', 'y'], [[1, 3], [7, 9]], {
      source: {},
      scales: [linear([0, 10]), linear([0, 10])]
    });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, true]);
  });

  it('supports single interval clauses', async () => {
    const clause = clauseInterval('x', [1, 3], { source: {}, scale: linear([0, 10]) });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, true]);
  });

  it('supports single-field composite interval clauses', async () => {
    const clause = clauseComposite([
      { type: 'interval', field: 'x', value: [1, 3], scale: linear([0, 10]) }
    ], { source: {} });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, true]);
  });

  it('supports interval clauses with identity scales', async () => {
    const clause = clauseInterval('x', [1, 3], { source: {}, scale: { type: 'identity' } });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, true]);
  });

  it('supports interval clauses with identity scales and a domain', async () => {
    const scale: ScaleOptions = { type: 'identity', domain: [0, 10] };
    const clause = clauseInterval('x', [1, 3], { source: {}, scale });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, true]);
  });

  it('does not support interval clauses with missing domain or range', async () => {
    const clause = clauseInterval('x', [1, 3], { source: {}, scale: { type: 'linear' } });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([6, false]);
  });

  it('supports composite interval and point clauses', async () => {
    const clause = clauseComposite([
      { type: 'interval', field: 'x', value: [1, 3], scale: linear([0, 10]) },
      { type: 'point', field: 'dim', value: ['b'] }
    ], { source: {} });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([3, true]);
  });

  it('supports composite clauses with null dimensions', async () => {
    const clause = clauseComposite([
      { type: 'interval', field: 'x', value: null, scale: linear([0, 10]) },
      { type: 'point', field: 'dim', value: ['b'] }
    ], { source: {} });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([7, true]);
  });

  it('supports composite clauses with null point values', async () => {
    const clause = clauseComposite([
      { type: 'point', field: 'dim', value: ['b'] },
      { type: 'point', field: 'x', value: [null, 4] }
    ], { source: {} });
    const { value, info } = await runQuery(count(), clause);
    expect([Number(value), !!info]).toStrictEqual([2, true]);
  });

  it('supports composite clauses with empty point values', async () => {
    const clause = clauseComposite([
      { type: 'interval', field: 'x', value: [1, 3], scale: linear([0, 10]) },
      { type: 'point', field: 'dim', value: [] }
    ], { source: {} });
    const { value, info } = await runQuery(count(), clause);
    expect([Number(value), !!info]).toStrictEqual([0, true]);
  });

  it('does not support composite clauses with unsupported scales', async () => {
    const band = { type: 'band', domain: [1, 3] } as unknown as ScaleOptions;
    const clause = clauseComposite([
      { type: 'interval', field: 'order', value: [1, 2], scale: band },
      { type: 'point', field: 'x', value: [3, 4] }
    ], { source: {} });
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([7, false]);
  });

  it('does not support composite clauses with mismatched dimensions', async () => {
    const clause = clauseComposite([
      { type: 'point', field: 'dim', value: ['b'] },
      { type: 'point', field: 'x', value: [3, 4] }
    ], { source: {} });
    clause.meta = { type: 'composite', dims: [{ type: 'point' }] } as CompositeMetadata;
    const { value, info } = await runQuery(sum('x'), clause);
    expect([value, !!info]).toStrictEqual([7, false]);
  });
});

describe.each(modes)('PreAggregator sketches (%s mode)', mode => {
  const { setup, runQuery } = harness(mode);
  const sketchLoadQuery = `
    SET allow_extension_repositories = 'allowed';
    CREATE EXTENSION REPOSITORY IF NOT EXISTS query_farm WITH PREFIX 'https://duckdb-extensions.query.farm';
    INSTALL datasketches FROM query_farm;
    LOAD datasketches FROM query_farm;
    ${loadQuery}`;
  const point = () => clausePoint('dim', 'b', { source: {} });

  /**
   * Query the test dataset with the given measure, filtered by a point
   * selection on dim = 'b'. Also queries the pre-aggregated table directly,
   * as standard queries are used as a fallback if pre-aggregation fails.
   * @param measure The aggregate measure or query function for the client.
   * @param useSketches The sketch approximation setting.
   * @returns The client measure value and the pre-aggregated measure value.
   */
  async function runSketch(measure: RunMeasure, useSketches: PreAggregateOptions['useSketches'] = false) {
    const clause = point();
    const { value, info, mc } = await runQuery(measure, clause, { useSketches }, sketchLoadQuery);
    const preagg = info
      ? (await mc.query(info.query(clause))).toArray()[0].measure
      : undefined;
    return [value, preagg];
  }

  it('merges hll sketch aggregates', async () => {
    const [value, preagg] = await runSketch(hllEstimate(hllSketch('x')));
    expect(value).toBeCloseTo(2, 5);
    expect(preagg).toBeCloseTo(2, 5);
  });

  it('merges hll union aggregates', async () => {
    const query = (predicate: FilterExpr = []) => {
      const sketches = Query.from('testData')
        .select({ dim: 'dim', s: hllSketch('x') })
        .groupby('dim');
      return Query.from(sketches)
        .select({ measure: hllEstimate(hllUnion('s')) })
        .where(predicate);
    };
    const [value, preagg] = await runSketch(query);
    expect(value).toBeCloseTo(2, 5);
    expect(preagg).toBeCloseTo(2, 5);
  });

  it('merges cpc sketch aggregates', async () => {
    const [value, preagg] = await runSketch(cpcEstimate(cpcSketch('x')));
    expect(value).toBeCloseTo(2, 3);
    expect(preagg).toBeCloseTo(2, 3);
  });

  it('merges kll sketch aggregates', async () => {
    expect(await runSketch(kllQuantile(kllSketch('x'), 0.5))).toStrictEqual([3, 3]);
    expect(await runSketch(kllQuantile(kllSketch('x'), 1))).toStrictEqual([4, 4]);
  });

  it('merges filtered sketch aggregates', async () => {
    const measure = kllQuantile(kllSketch('x').where(gt('x', 3)), 0);
    expect(await runSketch(measure)).toStrictEqual([4, 4]);
  });

  it('approximates distinct counts with sketches', async () => {
    expect(await runSketch(count('x').distinct(), true)).toStrictEqual([2, 2]);
    expect(await runSketch(count('y').distinct().where(gt('y', 6)), true)).toStrictEqual([1, 1]);
    expect(await runSketch(count('x').distinct().where(gt('x', 4)), true)).toStrictEqual([0, 0]);
  });

  it('approximates quantiles with sketches', async () => {
    expect(await runSketch(median('x'), true)).toStrictEqual([3, 3]);
    expect(await runSketch(quantile('x', 0), true)).toStrictEqual([3, 3]);
    expect(await runSketch(quantile('x', 1), true)).toStrictEqual([4, 4]);
    expect(await runSketch(add(quantile('x', 0), median('y')), true)).toStrictEqual([9, 9]);
  });

  it('does not approximate distinct counts or quantiles by default', async () => {
    expect(await runSketch(count('x').distinct())).toStrictEqual([2, undefined]);
    expect(await runSketch(median('x'))).toStrictEqual([3.5, undefined]);
  });

  it('approximates only selected aggregate types', async () => {
    const distinct = { distinct: true };
    expect(await runSketch(count('x').distinct(), distinct)).toStrictEqual([2, 2]);
    expect(await runSketch(median('x'), distinct)).toStrictEqual([3.5, undefined]);
    const quantiles = { quantile: true };
    expect(await runSketch(count('x').distinct(), quantiles)).toStrictEqual([2, undefined]);
    expect(await runSketch(median('x'), quantiles)).toStrictEqual([3, 3]);
    const both = { distinct: true, quantile: true };
    expect(await runSketch(add(count('x').distinct(), median('x')), both)).toStrictEqual([5, 5]);
    expect(await runSketch(add(count('x').distinct(), median('x')), distinct)).toStrictEqual([5.5, undefined]);
  });

  it('normalizes the useSketches setting', async () => {
    const mc = await setup(loadQuery, { useSketches: true });
    const pre = mc.preaggregator;
    expect(pre.useSketches).toStrictEqual({ distinct: true, quantile: true });
    pre.useSketches = { quantile: true };
    expect(pre.useSketches).toStrictEqual({ distinct: false, quantile: true });
    pre.useSketches = false;
    expect(pre.useSketches).toStrictEqual({ distinct: false, quantile: false });
    expect(Object.isFrozen(pre.useSketches)).toBe(true);
  });

  it('clears state when the useSketches setting changes', async () => {
    const mc = await setup(loadQuery);
    const pre = mc.preaggregator;
    const client = new TestClient(null);
    pre.entries.set(client, null);
    pre.useSketches = { distinct: false };
    expect(pre.entries.size).toBe(1);
    pre.useSketches = { distinct: true };
    expect(pre.entries.size).toBe(0);
  });

  it('does not approximate quantiles with non-literal probabilities', async () => {
    expect(await runSketch(quantile('x', sql`0.5`), true)).toStrictEqual([3, undefined]);
    expect(await runSketch(median('x').distinct(), true)).toStrictEqual([3.5, undefined]);
  });

  it('ignores NaN values in quantile sketches', async () => {
    const nan = sql`CASE WHEN "x" = 4 THEN 'NaN'::DOUBLE END`;
    expect(await runSketch(median(nan), { quantile: true })).toStrictEqual([null, null]);
  });

  it('merges sketches across interval bins', async () => {
    const scale: ScaleOptions = { type: 'linear', domain: [0, 10], range: [0, 100] };
    const clause = clauseInterval('x', [1, 3], { source: {}, scale });
    const { value, info, mc } = await runQuery(count('y').distinct(), clause, { useSketches: true }, sketchLoadQuery);
    const preagg = (await mc.query(info!.query(clause))).toArray()[0].measure;
    expect([value, preagg]).toStrictEqual([3, 3]);
  });

  it('includes sketch columns only when needed', () => {
    const client = new TestClient(Query
      .from('testData')
      .select({ dim: 'dim', a: count('x').distinct(), b: median('x') })
      .groupby('dim'));
    expect(preaggColumns(client)).toBeNull();
    expect(preaggColumns(client, { distinct: true })).toBeNull();
    const cols = preaggColumns(client, { distinct: true, quantile: true })!;
    expect(cols.sketches).toBe(true);
    expect(Object.values(cols.preagg).map(String)).toStrictEqual([
      '"dim"',
      'datasketch_cpc(11, hash("x")) FILTER (WHERE ("x" IS NOT NULL))',
      'datasketch_kll(200, "x") FILTER (WHERE (NOT isnan("x")))'
    ]);
    expect(String(cols.output.a)).toMatch(/^coalesce\(round\(datasketch_cpc_estimate\(datasketch_cpc_union\(11, "pre_[0-9a-f]+"\)\)\), 0\)$/);
    expect(String(cols.output.b)).toMatch(/^datasketch_kll_quantile\(datasketch_kll\(200, "pre_[0-9a-f]+"\), 0.5, TRUE\)$/);
  });
});
