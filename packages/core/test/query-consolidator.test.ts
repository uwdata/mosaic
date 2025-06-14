import { describe, it, expect } from 'vitest';
import { Query, count, sum } from '@uwdata/mosaic-sql';
import { consolidator } from '../src/QueryConsolidator.js';
import { Priority } from '../src/QueryManager.js';
import { voidCache } from '../src/util/cache.js';

describe('QueryConsolidation', () => {
  async function getConsolidatedQueries(...qs) {
    const consolidated = [];
    const c = consolidator(q => consolidated.push(q.request.query.toString()), voidCache(), () => {/*ignore*/});
    for(const q of qs) {
      c.add({request: { type: 'arrow', query: q }}, Priority.Normal);
    }
    await new Promise(resolve => setImmediate(resolve));
    return consolidated;
  }

  it('should consolidate non-grouped aggregated queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: count() });
    const q2 = Query.from({ source: 'table' }).select({ c: sum() });
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' }).select({ col0: count(), col1: sum() }).toString(),
    ]);
  });

  it('should consolidate non-grouped non-aggregated queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: 'x' });
    const q2 = Query.from({ source: 'table' }).select({ c: 'y' });
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' }).select({ col0: 'x', col1: 'y' }).toString(),
    ]);
  });

  it('should not consolidate non-grouped aggregated and non-aggregated queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: 'x' });
    const q2 = Query.from({ source: 'table' }).select({ c: count() });
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      q1.toString(),
      q2.toString(),
    ]);
  });
});
