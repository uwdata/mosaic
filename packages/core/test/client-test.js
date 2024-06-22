import assert from 'node:assert';
import { Query, count } from '@uwdata/mosaic-sql';
import { nodeConnector } from './util/node-connector.js';
import { Coordinator, MosaicClient, Selection, clauseInterval } from '../src/index.js';
import { QueryResult } from '../src/util/query-result.js';

describe('MosaicClient', () => {
  it('is filtered by selections', async () => {
    // instantiate coordinator to use node.js DuckDB
    // disable logging and data cube indexes
    const coord = new Coordinator(nodeConnector(), {
      logger: null,
      indexes: { enabled: false }
    });

    // load test data
    await coord.exec(
      `CREATE TABLE testData AS (
        SELECT 12 AS HourOfDay, 1 AS DayOfWeek UNION ALL
        SELECT 10 AS HourOfDay, 3 AS DayOfWeek
      )`
    );

    // pending query results
    let pending = [];

    // test client class
    class TestClient extends MosaicClient {
      constructor(tableName, columnName, filterBy) {
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
        this.pending = new QueryResult();
        pending.push(this.pending);
      }
      queryResult(data) {
        // fulfill pending promise with sorted data
        this.pending.fulfill(
          data.toArray()
            .map(row => row.toJSON())
            .sort((a, b) => a.key - b.key)
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

    // initial results with empty selection
    assert.deepStrictEqual(
      await Promise.all(pending),
      [
        [ {key: 10, value: 1}, {key: 12, value: 1} ],
        [ {key: 1, value: 1}, {key: 3, value: 1} ]
      ]
    );
    pending = [];

    // selection should produce empty arrays (no where clauses)
    assert.deepStrictEqual(selection.predicate(client1), []);
    assert.deepStrictEqual(selection.predicate(client2), []);

    // -- UPDATE SELECTION FROM CLIENT 1 --

    // update first selection with client1 as source
    // crossfilter should skip client1, indicated by undefined result
    // client2 should be filtered by HourOfDay
    selection.update(
      clauseInterval('HourOfDay', [0, 24], { source: client1 })
    );
    assert.strictEqual(selection.active?.source, client1);
    assert.strictEqual(selection.predicate(client1), undefined);
    assert.strictEqual(
      selection.predicate(client2)+'',
      `("HourOfDay" BETWEEN 0 AND 24)`
    );

    // only client 2 should get a data update
    assert.deepStrictEqual(
      await Promise.all(pending),
      [ [ {key: 1, value: 1}, {key: 3, value: 1} ] ]
    );
    pending = [];

    // wait for internal selection update to complete
    // pending data promises may resolve before selection event queue advances
    await selection.pending('value');

    // -- UPDATE SELECTION FROM CLIENT 2 --

    // update second selection with client2 as source
    // client1 should be filtered by DayOfWeek
    // crossfilter should skip client2, indicated by undefined result
    selection.update(
      clauseInterval('DayOfWeek', [0, 7], { source: client2 })
    );
    assert.strictEqual(selection.active?.source, client2);
    assert.strictEqual(
      selection.predicate(client1)+'',
      `("DayOfWeek" BETWEEN 0 AND 7)`
    );
    assert.strictEqual(selection.predicate(client2), undefined);

    // only client 1 should get a data update
    assert.deepStrictEqual(
      await Promise.all(pending),
      [ [ {key: 10, value: 1}, {key: 12, value: 1} ] ]
    );
    pending = [];
  });
});
