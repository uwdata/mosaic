import assert from 'node:assert';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';

describe('QueryManager', () => {
  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      query: async ({ sql }) => {
        assert.equal(sql, 'SELECT 1');
        return [{ column: 1 }];
      }
    });

    const request = {
      type: 'arrow',
      query: 'SELECT 1'
    };

    const result = queryManager.request(request);
    assert(result instanceof QueryResult);

    const data = await result;
    assert.deepStrictEqual(data, [{ column: 1 }]);
  });

  it('should not run a query when there is a pending exec', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      query: async ({ sql }) => {
        assert.equal(sql, 'CREATE TABLE test (id INT)');
        return undefined;
      }
    });

    const request1 = {
      type: 'exec',
      query: 'CREATE TABLE test (id INT)'
    };

    const request2 = {
      type: 'arrow',
      query: 'SELECT * FROM test'
    };

    queryManager.request(request1);
    queryManager.request(request2);

    assert.equal(queryManager.pendingResults.length, 1);
  });
});
