import type { DescribeQuery, Query } from '@uwdata/mosaic-sql';
import type { Table } from '@uwdata/flechette';
import { isAggregateExpression, isColumnRef, isDescribeQuery, isSelectQuery } from '@uwdata/mosaic-sql';
import { QueryResult } from './util/query-result.js';

interface QueryEntry {
  request: {
    type: string;
    cache?: boolean;
    query: Query | DescribeQuery;
  };
  result: QueryResult;
}

interface GroupEntry {
  entry: QueryEntry;
  priority: number;
  index: number;
}

interface QueryGroup extends Array<GroupEntry> {
  query?: Query;
  result?: QueryResult;
  maps?: Array<Array<[string, string]>>;
}

function wait(callback: () => void): any {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  } else if (typeof setImmediate !== 'undefined') {
    return setImmediate(callback);
  } else {
    return setTimeout(callback);
  }
}

/**
 * Create a consolidator to combine structurally compatible queries.
 * @param enqueue Query manager enqueue method
 * @param cache Client-side query cache (sql -> data)
 * @returns A consolidator object
 */
export function consolidator(
  enqueue: (entry: QueryEntry, priority?: number) => void,
  cache: { get: (key: string) => any; set: (key: string, value: any) => any }
) {
  let pending: GroupEntry[] = [];
  let id = 0;

  function run(): void {
    // group queries into bundles that can be consolidated
    const groups = entryGroups(pending, cache);
    pending = [];
    id = 0;

    // build and issue consolidated queries
    for (const group of groups) {
      consolidate(group, enqueue);
      processResults(group, cache);
    }
  }

  return {
    add(entry: QueryEntry, priority: number): void {
      if (entry.request.type === 'arrow') {
        // wait one frame, gather an ordered list of queries
        // only Apache Arrow is supported, so we can project efficiently
        id = id || wait(() => run());
        pending.push({ entry, priority, index: pending.length });
      } else {
        enqueue(entry, priority);
      }
    }
  };
}

/**
 * Segment query requests into consolidation-compatible groups.
 * @param entries Query request entries ({ request, result } objects)
 * @param cache Client-side query cache
 * @returns An array of grouped entry arrays
 */
function entryGroups(entries: GroupEntry[], cache: any): QueryGroup[] {
  const groups: QueryGroup[] = [];
  const groupMap = new Map<string, QueryGroup>();

  for (const query of entries) {
    const { entry: { request } } = query;
    const key = consolidationKey(request.query, cache);
    if (!groupMap.has(key)) {
      const list: QueryGroup = [];
      groups.push(list);
      groupMap.set(key, list);
    }
    groupMap.get(key)!.push(query);
  }

  return groups;
}

/**
 * Generate a key string for query consolidation.
 * Queries with matching keys are conosolidation-compatible.
 * If a query is found in the cache, it is exempted from consolidation,
 * which is indicated by returning the precise query SQL as the key.
 * @param query The input query.
 * @param cache The query cache (sql -> data).
 * @returns a key string
 */
function consolidationKey(query: Query | DescribeQuery, cache: any): string {
  const sql = `${query}`;
  if (isSelectQuery(query) && !cache.get(sql)) {
    if (
      query._orderby.length || query._where.length ||
      query._qualify.length || query._having.length
    ) {
      // do not try to analyze if query includes clauses
      // that may refer to *derived* columns we can't resolve
      return sql;
    }

    // create a derived query stripped of selections
    const q = query.clone().setSelect('*');

    // check group by criteria for compatibility
    // queries may refer to *derived* columns as group by criteria
    // we resolve these against the true grouping expressions
    const groupby = query._groupby;
    if (groupby.length) {
      const map: Record<string, any> = {}; // expression map (alias -> expr)
      query._select.forEach(({ alias, expr }) => map[alias] = expr);
      q.setGroupby(groupby.map(e => (isColumnRef(e) && map[e.column]) || e));
    }
    else if (query._select.some(e => isAggregateExpression(e.expr))) {
      // if query is an ungrouped aggregate, add an explicit groupby to
      // prevent improper consolidation with non-aggregate queries
      q.setGroupby('ALL');
    }

    // key is just the transformed query as SQL
    return `${q}`;
  } else {
    // can not analyze query, simply return as string
    return sql;
  }
}

/**
 * Issue queries, consolidating where possible.
 * @param group Array of bundled query entries
 * @param enqueue Add entry to query queue
 */
function consolidate(group: QueryGroup, enqueue: (entry: QueryEntry, priority?: number) => void): void {
  if (shouldConsolidate(group)) {
    // issue a single consolidated query
    enqueue({
      request: {
        type: 'arrow',
        cache: false,
        query: (group.query = consolidatedQuery(group))
      },
      result: (group.result = new QueryResult())
    });
  } else {
    // issue queries directly
    for (const { entry, priority } of group) {
      enqueue(entry, priority);
    }
  }
}

/**
 * Check if a group contains multiple distinct queries.
 * @param group Array of bundled query entries
 * @returns false if group contains a single (possibly repeated) query,
 *  otherwise true
 */
function shouldConsolidate(group: QueryGroup): boolean {
  if (group.length > 1) {
    const sql = `${group[0].entry.request.query}`;
    for (let i = 1; i < group.length; ++i) {
      if (sql !== `${group[i].entry.request.query}`) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Create a consolidated query for a group.
 * @param group Array of bundled query entries
 * @returns A consolidated Query instance
 */
function consolidatedQuery(group: QueryGroup): Query {
  const maps: Array<Array<[string, string]>> = group.maps = [];
  const fields = new Map<string, [string, any]>();

  // gather select fields
  for (const item of group) {
    const { query } = item.entry.request as { query: Query };
    const fieldMap: Array<[string, string]> = [];
    maps.push(fieldMap);
    for (const { alias, expr } of (query as any)._select) {
      const e = `${expr}`;
      if (!fields.has(e)) {
        fields.set(e, [`col${fields.size}`, expr]);
      }
      const [name] = fields.get(e)!;
      fieldMap.push([name, alias]);
    }
  }

  // use a cloned query as a starting point
  const query = (group[0].entry.request.query as Query).clone();

  // update group by statement as needed
  const groupby = (query as any)._groupby;
  if (groupby.length) {
    const map: Record<string, string> = {};
    group.maps[0].forEach(([name, as]) => map[as] = name);
    (query as any).setGroupby(groupby.map((e: any) => (isColumnRef(e) && map[e.column]) || e));
  }

  // update select statement and return
  return (query as any).setSelect(Array.from(fields.values()));
}

/**
 * Process query results, dispatch results to original requests
 * @param group Array of query requests
 * @param cache Client-side query cache (sql -> data)
 */
async function processResults(group: QueryGroup, cache: any): Promise<void> {
  const { maps, query, result } = group;

  // exit early if no consolidation performed
  // in this case results are passed directly
  if (!maps) return;

  // await consolidated query result, pass errors if needed
  let data: any;
  try {
    data = await result;
  } catch (err) {
    // pass error to consolidated queries
    for (const { entry } of group) {
      entry.result.reject(err);
    }
    return;
  }

  // extract result for each query in the consolidation group
  // update cache and pass extract to original issuer
  const describe = isDescribeQuery(query!);
  group.forEach(({ entry }, index) => {
    const { request, result } = entry;
    const map = maps[index];
    const extract = describe && map ? filterResult(data, map)
      : map ? projectResult(data, map)
      : data;
    if (request.cache) {
      cache.set(String(request.query), extract);
    }
    result.fulfill(extract);
  });
}

/**
 * Project a consolidated result to a client result
 * @param data Consolidated query result, as an Arrow Table
 * @param map Column name map as [source, target] pairs
 * @returns the projected Apache Arrow table
 */
function projectResult(data: Table, map: Array<[string, string]>): Table {
  return data.select(map.map(x => x[0]), map.map(x => x[1]));
}

/**
 * Filter a consolidated describe query result to a client result
 * @param data Consolidated query result, as an Arrow Table
 * @param map Column name map as [source, target] pairs
 * @returns the filtered table data
 */
function filterResult(data: Table, map: Array<[string, string]>): any[] {
  const lookup = new Map(map);
  const result: any[] = [];
  for (const d of data) {
    if (lookup.has(d.column_name)) {
      result.push({ ...d, column_name: lookup.get(d.column_name) })
    }
  }
  return result;
}