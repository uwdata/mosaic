import { describe, it, expect } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import { QueryRequest } from '../src/types.js';

describe('QueryManager', () => {
  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe('SELECT 1');
        return [{ column: 1 }];
      }
    });

    const request: QueryRequest = {
      type: 'arrow',
      query: 'SELECT 1'
    };

    const result = queryManager.request(request);
    expect(result).toBeInstanceOf(QueryResult);

    const data = await result;
    expect(data).toEqual([{ column: 1 }]);
  });

  it('should not run a query when there is a pending exec', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: ({ sql }) => {
        expect(sql).toBe('CREATE TABLE test (id INT)');
        return new Promise(() => {});
      }
    });

    const request1: QueryRequest = {
      type: 'exec',
      query: 'CREATE TABLE test (id INT)'
    };

    const request2: QueryRequest = {
      type: 'arrow',
      query: 'SELECT * FROM test'
    };

    queryManager.request(request1);
    queryManager.request(request2);

    expect(queryManager.pendingResults).toHaveLength(1);
  });
});
