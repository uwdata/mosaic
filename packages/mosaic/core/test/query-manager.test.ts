import { describe, it, expect } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult, QueryState } from '../src/util/query-result.js';
import { QueryRequest } from '../src/types.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

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

  it('submits queries without waiting for a pending exec', () => {
    const queryManager = new QueryManager();
    const sent: string[] = [];

    queryManager.connector({
      // @ts-expect-error assumes type value
      query: ({ sql }) => {
        sent.push(sql);
        return new Promise(() => {});
      }
    });

    queryManager.request({ type: 'exec', query: 'CREATE TABLE test (id INT)' });
    queryManager.request({ type: 'arrow', query: 'SELECT * FROM test' });

    expect(sent).toEqual(['CREATE TABLE test (id INT)', 'SELECT * FROM test']);
    expect(queryManager.pendingResults).toHaveLength(2);
  });

  it('limits the number of concurrent requests', async () => {
    const queryManager = new QueryManager(2);
    const resolvers: ((value: unknown) => void)[] = [];

    queryManager.connector({
      query: () => new Promise(resolve => resolvers.push(resolve))
    });

    const results = [0, 1, 2].map(i =>
      queryManager.request({ type: 'arrow', query: `SELECT ${i}` })
    );
    expect(resolvers).toHaveLength(2);

    resolvers[0]([]);
    await results[0];
    await wait();
    expect(resolvers).toHaveLength(3);
  });

  it('resolves results as they complete', async () => {
    const queryManager = new QueryManager();
    const resolvers: ((value: unknown) => void)[] = [];

    queryManager.connector({
      query: () => new Promise(resolve => resolvers.push(resolve))
    });

    const first = queryManager.request({ type: 'arrow', query: 'SELECT 0' });
    const second = queryManager.request({ type: 'arrow', query: 'SELECT 1' });

    resolvers[1]([1]);
    expect(await second).toEqual([1]);
    expect(first.state).toBe(QueryState.pending);
  });
});
