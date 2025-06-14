import { describe, it, expect } from 'vitest';
import { Coordinator, coordinator } from '../src/index.js';
import { QueryResult, QueryState } from '../src/util/query-result.js';

async function wait() {
  return new Promise(setTimeout);
}

describe('coordinator', () => {
  it('has accessible singleton', () => {
    const mc = coordinator();
    expect(mc).toBeInstanceOf(Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    expect(coordinator()).toBe(mc2);
  });

  it('query results returned in correct order', async () => {
    const promises = [];

    // Mock the connector
    const connector = {
      async query() {
        const promise = new QueryResult();
        promises.push(promise);
        return promise;
      },
    };

    const coord = new Coordinator(connector, { logger: null });

    const r0 = coord.query('SELECT 0');
    const r1 = coord.query('SELECT 1');
    const r2 = coord.query('SELECT 2');
    const r3 = coord.query('SELECT 3');

    // queries have not been sent yet
    expect(promises).toHaveLength(0);

    await wait();

    // all queries should have been sent to the connector
    expect(promises).toHaveLength(4);
    expect(coord.manager.pendingResults).toHaveLength(4);

    // resolve promises in reverse order

    promises.at(3).fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.pending);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(1).fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.ready);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(0).fulfill(0);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(2);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(2).fulfill(0);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(0);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.done);
    expect(r3.state).toEqual(QueryState.done);
  });
});
