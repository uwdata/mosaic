import { describe, it, expect } from 'vitest';
import { type Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { Query, SelectQuery, count, literal, sum } from '@uwdata/mosaic-sql';
import { consolidator } from '../src/QueryConsolidator.js';
import { Priority } from '../src/QueryManager.js';
import type { Cache, QueryEntry, QueryType } from '../src/types.js';
import { jsonByteLength, lruCache, voidCache } from '../src/util/cache.js';
import { decodeIPC, tableByteLength } from '../src/util/decode-ipc.js';
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
  interface CacheCall {
    key: string;
    value: unknown;
    bytes?: number;
    owner?: object;
  }

  function recordingCache(): Cache & { calls: CacheCall[] } {
    const calls: CacheCall[] = [];
    return {
      calls,
      get: () => undefined,
      set(key, value, bytes, owner) {
        calls.push({ key, value, bytes, owner });
        return value;
      },
      clear: () => {}
    };
  }

  function decodedTable(columns: Record<string, unknown[]>): Table {
    return decodeIPC(tableToIPC(tableFromArrays(columns), {})!);
  }

  // DescribeQuery is not a SelectQuery, so the consolidator never groups real
  // describe queries; this shim makes the consolidated query a DescribeQuery.
  function describeQuery(select: Record<string, string>): SelectQuery {
    const query = Query.from({ source: 'table' }).select(select);
    query.setSelect = function (...expr) {
      SelectQuery.prototype.setSelect.apply(this, expr);
      return Query.describe(this) as unknown as SelectQuery;
    };
    return query;
  }

  function selectQueries(...columns: string[]) {
    return columns.map(c => Query.from({ source: 'table' }).select({ c }));
  }

  async function consolidate(
    queries: unknown[],
    data: Table,
    cache: Cache
  ): Promise<unknown[]> {
    const entries: QueryEntry[] = queries.map(query => ({
      request: { type: 'arrow', cache: true, query: query as QueryType },
      result: new QueryResult()
    }));
    const c = consolidator(entry => {
      if (entry.request.cache === false) entry.result.fulfill(data);
    }, cache);
    for (const entry of entries) {
      c.add(entry, Priority.Normal);
    }
    return Promise.all(entries.map(entry => entry.result));
  }

  it('should charge projected extracts to the merged table', async () => {
    const data = decodedTable({ col0: [1, 2], col1: [3, 4], col2: [5, 6] });
    const queries = selectQueries('x', 'y', 'z');
    const cache = recordingCache();
    const extracts = await consolidate(queries, data, cache) as Table[];

    expect(cache.calls.map(call => call.key))
      .toEqual(queries.map(query => String(query)));
    for (const [index, call] of cache.calls.entries()) {
      expect(call.value).toBe(extracts[index]);
      expect(call.bytes).toBe(tableByteLength(data));
      expect(call.owner).toBe(data);
    }

    expect(new Set(extracts).size).toBe(3);
    expect(extracts.some(extract => extract === data)).toBe(false);
    expect(Array.from(extracts[1])).toEqual([{ c: 3 }, { c: 4 }]);
  });

  it('should keep extracts of one merged buffer under a tight byte budget', async () => {
    const data = decodedTable({ col0: [1, 2], col1: [3, 4], col2: [5, 6] });
    const queries = selectQueries('x', 'y', 'z');
    const bytes = tableByteLength(data)!;
    const cache = lruCache({ maxBytes: bytes + 1 });
    const extracts = await consolidate(queries, data, cache);

    queries.forEach((query, index) => {
      expect(cache.get(String(query))).toBe(extracts[index]);
    });

    cache.set('other', {}, bytes);
    expect(queries.map(query => cache.get(String(query))))
      .toEqual([undefined, undefined, undefined]);
    expect(cache.get('other')).toEqual({});
  });

  it('should charge describe extracts by their JSON length', async () => {
    const data = decodedTable({
      column_name: ['col0', 'col1'],
      column_type: ['DOUBLE', 'VARCHAR']
    });
    const queries = [describeQuery({ a: 'x' }), describeQuery({ b: 'y' })];
    const cache = recordingCache();
    const extracts = await consolidate(queries, data, cache);

    expect(extracts).toEqual([
      [{ column_name: 'a', column_type: 'DOUBLE' }],
      [{ column_name: 'b', column_type: 'VARCHAR' }]
    ]);
    for (const [index, call] of cache.calls.entries()) {
      expect(call.bytes).toBe(jsonByteLength(extracts[index]));
      expect(call.owner).toBeUndefined();
    }
  });
});
