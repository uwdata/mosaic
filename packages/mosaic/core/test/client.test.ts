import { describe, it, expect } from 'vitest';
import { Query, count } from '@uwdata/mosaic-sql';
import { nodeConnector } from './util/node-connector.js';
import { ClauseSource, Coordinator, MosaicClient, Selection, clauseInterval } from '../src/index.js';
import { QueryResult } from '../src/util/query-result.js';

describe('MosaicClient', () => {
  it('is filtered by selections', async () => {
    // instantiate coordinator to use node.js DuckDB
    // disable logging and preaggregation
    const coord = new Coordinator(nodeConnector(), {
      logger: null,
      preagg: { enabled: false }
    });

    // load test data
    await coord.exec(
      `CREATE TABLE testData AS (
        SELECT 12 AS HourOfDay, 1 AS DayOfWeek UNION ALL
        SELECT 10 AS HourOfDay, 3 AS DayOfWeek
      )`
    );

    // pending query results
    let pending: QueryResult[] = [];

    // test client class
    class TestClient extends MosaicClient {
      private tableName: string;
      private columnName: string;
      private pendingResult: QueryResult;

      constructor(tableName: string, columnName: string, filterBy?: Selection) {
        super(filterBy);
        this.tableName = tableName;
        this.columnName = columnName;
      }
      query(filter = []) {
        const { tableName, columnName } = this;
        return Query.from(tableName)
          .select({ key: columnName, value: count() })
          .groupby(columnName)
          .where(filter);
      }
      queryPending() {
        // add result promise to global pending queue
        this.pendingResult = new QueryResult();
        pending.push(this.pendingResult);
        return this;
      }
      queryResult(data) {
        // fulfill pending promise with sorted data
        this.pendingResult.fulfill(
          data.toArray().sort((a, b) => a.key - b.key)
        );
        return this;
      }
    }

    // -- INITIALIZE CLIENTS --

    const selection = Selection.crossfilter();
    const client1 = new TestClient('testData', 'HourOfDay', selection);
    const client2 = new TestClient('testData', 'DayOfWeek', selection);
    coord.connect(client1);
    coord.connect(client2);

    await Promise.all([client1.pending, client2.pending]);

    // initial results with empty selection
    expect(await Promise.all(pending)).toEqual([
      [ {key: 10, value: 1}, {key: 12, value: 1} ],
      [ {key: 1, value: 1}, {key: 3, value: 1} ]
    ]);
    pending = [];

    // selection should produce empty arrays (no where clauses)
    expect(selection.predicate(client1)).toEqual([]);
    expect(selection.predicate(client2)).toEqual([]);

    // -- UPDATE SELECTION FROM CLIENT 1 --

    // update first selection with client1 as source
    // crossfilter should skip client1, indicated by undefined result
    // client2 should be filtered by HourOfDay
    selection.update(
      clauseInterval('HourOfDay', [0, 24], { source: client1 as ClauseSource })
    );
    expect(selection.active?.source).toBe(client1);
    expect(selection.predicate(client1)).toBeUndefined();
    expect(selection.predicate(client2)+'').toBe(
      `("HourOfDay" BETWEEN 0 AND 24)`
    );

    // only client 2 should get a data update
    expect(await Promise.all(pending)).toEqual([
      [ {key: 1, value: 1}, {key: 3, value: 1} ]
    ]);
    pending = [];

    // wait for internal selection update to complete
    // pending data promises may resolve before selection event queue advances
    await selection.pending('value');

    // -- UPDATE SELECTION FROM CLIENT 2 --

    // update second selection with client2 as source
    // client1 should be filtered by DayOfWeek
    // crossfilter should skip client2, indicated by undefined result
    selection.update(
      clauseInterval('DayOfWeek', [0, 7], { source: client2 as ClauseSource })
    );
    expect(selection.active?.source).toBe(client2);
    expect(selection.predicate(client1)+'').toBe(
      `("DayOfWeek" BETWEEN 0 AND 7)`
    );
    expect(selection.predicate(client2)).toBeUndefined();

    // only client 1 should get a data update
    expect(await Promise.all(pending)).toEqual([
      [ {key: 10, value: 1}, {key: 12, value: 1} ]
    ]);
    pending = [];
  });

  it('respects enabled status', async () => {
    // instantiate coordinator to use node.js DuckDB
    // disable logging and preaggregation
    const coord = new Coordinator(nodeConnector(), {
      logger: null,
      preagg: { enabled: false }
    });

    let prepared = false;
    let queried = false;
    let result = null;

    class TestClient extends MosaicClient {
      constructor() { super(undefined); this.enabled = false; }
      async prepare() { prepared = true; }
      query() { queried = true; return Query.select({ foo: 1 }); }
      queryResult(data) { result = data; return this; }
    }

    // client is disabled, lifecycle methods should defer
    const client = new TestClient();
    coord.connect(client);
    await client.pending;
    expect(prepared).toBe(false);
    expect(queried).toBe(false);
    expect(result).toBe(null);

    // enable client, initialization and query should proceed
    client.enabled = true;
    await client.pending;
    expect(prepared).toBe(true);
    expect(queried).toBe(true);
    expect(result == null).toBe(false);

    // clear state and disable client
    prepared = false;
    queried = false;
    result = null;
    client.enabled = false;

    // request re-initialization, methods should defer
    client.initialize();
    await client.pending;
    expect(prepared).toBe(false);
    expect(queried).toBe(false);
    expect(result).toBe(null);

    // re-enable client, lifecycle methods should proceed
    client.enabled = true;
    await client.pending;
    expect(prepared).toBe(true);
    expect(queried).toBe(true);
    expect(result == null).toBe(false);
  });
});
