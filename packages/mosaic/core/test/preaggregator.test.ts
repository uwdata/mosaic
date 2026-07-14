import { describe, it, expect } from 'vitest';
import type { CreateQuery, ExprNode, FilterExpr } from "@uwdata/mosaic-sql";
import { Query, add, argmax, argmin, avg, corr, count, covarPop, covariance, desc, filterPushdown, geomean, gt, literal, loadObjects, max, min, mul, neq, product, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSXX, regrSXY, regrSYY, regrSlope, sql, stddev, stddevPop, sum, upper, varPop, variance } from '@uwdata/mosaic-sql';
import { clausePoint, Coordinator, Selection, SelectionClause } from '../src/index.js';
import type { PreAggregateInfo } from '../src/preagg/PreAggregator.js';
import { preaggColumns } from '../src/preagg/preagg-columns.js';
import { NodeConnector } from '../src/connectors/NodeConnector.js';
import { TestClient } from './util/test-client.js';

async function setup(loadQuery: CreateQuery) {
  const mc = new Coordinator(await NodeConnector.make(), {
    logger: null,
    cache: false,
    consolidate: false
  });
  await mc.exec(loadQuery);
  return mc;
}

type Datum = { measure: number };
type RunMeasure = ExprNode | ((predicate?: FilterExpr) => Query);

const loadQuery = loadObjects('testData', [
  { dim: 'a', cat: "c", order: 1, x: 1, y: 9 },
  { dim: 'a', cat: "c", order: 2, x: 2, y: 8 },
  { dim: 'b', cat: "d", order: 1, x: 3, y: 7 },
  { dim: 'b', cat: "d", order: 2, x: 4, y: 6 },
  { dim: 'b', cat: "d", order: 3, x: null, y: null }
]);

/**
 * Query the test dataset with the given measure, filtered by the clause.
 * @param measure The aggregate measure or query function for the client.
 * @param clause The selection clause to apply.
 * @returns The measure value, the pre-aggregation entry (if any),
 *  and the coordinator.
 */
async function runQuery(measure: RunMeasure, clause: SelectionClause) {
  const mc = await setup(loadQuery);
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
        console.error("QUERY ERROR", err);
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

describe('PreAggregator', () => {
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

  it('supports queries with renamed groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), Cat: 'cat' })
        .groupby("cat")
        .where(predicate)
        .orderby(desc("measure"))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports queries with expression-valued groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x'), Cat: 'cat' })
        .groupby("Cat", upper("cat"))
        .where(predicate)
        .orderby(desc("measure"))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports expression-valued selection fields', async () => {
    const size = sql`CASE WHEN "x" > 2 THEN 'big' ELSE 'small' END`;
    const clause = clausePoint(size, 'big', { source: {} });
    const { value, info, mc } = await runQuery(sum('x'), clause);
    expect(value).toBe(7);

    // one preaggregate row per expression value ('big', 'small')
    const rows = await mc.query(Query.from(info!.table).select({ n: count() }));
    expect(rows.get(0).n).toBe(2);
  });

  it('supports case-insensitive collisions among groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x') })
        .groupby("cat", "CAT")
        .where(predicate)
        .orderby(desc("measure"))
    };
    expect(await run(query)).toStrictEqual([3.5, true]);
  });

  it('supports duplicate groupby dimensions', async () => {
    const query = (predicate: FilterExpr = []) => {
      return Query.from('testData')
        .select({ measure: avg('x') })
        .groupby("cat", "cat")
        .where(predicate)
        .orderby(desc("measure"))
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
});
