import { describe, it, expect } from 'vitest';
import { type Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { Query, count, literal, sum } from '@uwdata/mosaic-sql';
import { consolidator } from '../src/QueryConsolidator.js';
import { Priority } from '../src/QueryManager.js';
import type { Cache, QueryEntry } from '../src/types.js';
import { voidCache } from '../src/util/cache.js';
import { decodeIPC } from '../src/util/decode-ipc.js';
import { QueryResult } from '../src/util/query-result.js';

describe('QueryConsolidation', () => {
  async function getConsolidatedQueries(...qs: unknown[]) {
    const consolidated: string[] = [];
    const c = consolidator(q => consolidated.push(q.request.query.toString()), voidCache());
    for(const q of qs) {
      // @ts-expect-error stub entry for test
      c.add({request: { type: 'arrow', query: q }}, Priority.Normal);
    }
    await new Promise(resolve => setImmediate(resolve));
    return consolidated;
  }

  it('should consolidate non-grouped aggregated queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: count() });
    const q2 = Query.from({ source: 'table' }).select({ c: sum('foo') });
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' }).select({ col0: count(), col1: sum('foo') }).toString(),
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

  it('should consolidate grouped aggregated queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: count() }).groupby('bar');
    const q2 = Query.from({ source: 'table' }).select({ c: sum('foo') }).groupby('bar');
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' })
        .select({ col0: count(), col1: sum('foo') })
        .groupby('bar')
        .toString(),
    ]);
  });

  it('should consolidate grouped aggregated queries with different group by orders', async () => {
    const q1 = Query.from({ source: 'table' }).select({ c: count() }).groupby('bar', 'baz');
    const q2 = Query.from({ source: 'table' }).select({ c: sum('foo') }).groupby('baz', 'bar');
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' })
        .select({ col0: count(), col1: sum('foo') })
        .groupby('bar', 'baz')
        .toString(),
    ]);
  });

  it('should consolidate grouped aggregated queries with positional reference', async () => {
    const q1 = Query.from({ source: 'table' }).select({ b: 'bar', c: count() }).groupby('bar');
    const q2 = Query.from({ source: 'table' }).select({ b: 'bar', c: sum('foo') }).groupby(literal(1));
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' })
        .select({ col0: 'bar', col1: count(), col2: sum('foo') })
        .groupby('bar')
        .toString(),
    ]);
  });

  it('should consolidate grouped aggregated queries with positional reference first', async () => {
    const q1 = Query.from({ source: 'table' }).select({ a: 'bar', b: 'bar', c: count() }).groupby(literal(2));
    const q2 = Query.from({ source: 'table' }).select({ b: 'bar', c: sum('foo') }).groupby('bar');
    const consolidated = await getConsolidatedQueries(q1, q2);
    expect(consolidated).toEqual([
      Query.from({ source: 'table' })
        .select({ col0: 'bar', col1: count(), col2: sum('foo') })
        .groupby('col0')
        .toString(),
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

  it('should not consolidate select distinct queries', async () => {
    const q1 = Query.from({ source: 'table' }).select({ u: 'x' }).distinct();
    const q2 = Query.from({ source: 'table' }).select({ v: 'y' });
    const q3 = Query.from({ source: 'table' }).select({ w: 'z' });
    const consolidated = await getConsolidatedQueries(q1, q2, q3);
    expect(consolidated).toEqual([
      q1.toString(),
      Query.from({ source: 'table' }).select({ col0: 'y', col1: 'z' }).toString(),
    ]);
  });
});

describe('QueryConsolidationCaching', () => {
  it('should charge projected extracts to the merged table', async () => {
    const bytes = tableToIPC(tableFromArrays({ col0: [1, 2], col1: [3, 4] }), {})!;
    const data = decodeIPC(bytes);
    const queries = ['x', 'y'].map(c => Query.from({ source: 'table' }).select({ c }));
    const entries: QueryEntry[] = queries.map(query => ({
      request: { type: 'arrow', cache: true, query },
      result: new QueryResult()
    }));

    const calls: unknown[][] = [];
    const cache: Cache = {
      get: () => undefined,
      set: (...args) => (calls.push(args), args[1]),
      clear: () => {}
    };
    const c = consolidator(entry => {
      if (entry.request.cache === false) entry.result.fulfill(data);
    }, cache);
    for (const entry of entries) {
      c.add(entry, Priority.Normal);
    }
    const extracts = await Promise.all(entries.map(entry => entry.result)) as Table[];

    expect(Array.from(extracts[1])).toEqual([{ c: 3 }, { c: 4 }]);
    expect(calls).toEqual([
      [String(queries[0]), extracts[0], bytes.length, data],
      [String(queries[1]), extracts[1], bytes.length, data]
    ]);
  });
});
