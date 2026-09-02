import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { Query } from '@uwdata/mosaic-sql';
import { describe, it, expect } from 'vitest';
import { type Cache, clausePoint, type Connector, Coordinator, coordinator, type JSONQueryRequest, makeClient, Selection } from '../src/index.js';
import { QueryResult, QueryState } from '../src/util/query-result.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

describe('coordinator', () => {
  it('has accessible singleton', () => {
    // Mock the connector, avoid instantiating default socket connector
    const connector = {
      async query() {
        return null;
      },
    } as unknown as Connector;

    const mc = coordinator(new Coordinator(connector));
    expect(mc).toBeInstanceOf(Coordinator);

    const mc2 = new Coordinator(connector);
    coordinator(mc2);

    expect(coordinator()).toBe(mc2);
  });

  it('query results returned in correct order', async () => {
    const ipc = tableToIPC(tableFromArrays({ a: [1] }), {})!;
    const promises: QueryResult[] = [];

    // Mock the connector
    const connector = {
      async query() {
        const promise = new QueryResult();
        promises.push(promise);
        return promise;
      },
    } as unknown as Connector;

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

    promises.at(3)!.fulfill(ipc);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.pending);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(1)!.fulfill(ipc);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.ready);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(0)!.fulfill(ipc);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(2);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(2)!.fulfill(ipc);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(0);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.done);
    expect(r3.state).toEqual(QueryState.done);
  });

  it('awaits initializing clients before selection updates', async () => {
    const events: string[] = [];

    // Mock the connector
    const connector = {
      async query(req: JSONQueryRequest) {
        const index = req.sql.includes("WHERE") ? 1 : 0;
        events.push(`CONNECT ${index}`);
        return { index };
      },
    } as unknown as Connector;

    // disable cache to ensure routing through connector
    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      preagg: { enabled: false }
    });
    const filterBy = Selection.crossfilter();
    let prepared = false;

    // create and connect client
    const client = makeClient({
      coordinator: coord,
      selection: filterBy,
      async prepare() {
        await wait(); // force wait
        prepared = true;
        events.push("PREPARE");
      },
      query(filter = []) {
        events.push(`QUERY ${prepared}`);
        return Query.select("*").from("foo").where(filter);
      }
    });

    // fire selection update
    filterBy.update(clausePoint("foo", 1, { source: {} }));

    // await initial query, then selection update
    await client.pending;
    await client.pending;

    // prepare should be first
    // query calls should come post-initialization
    // all queries should include filter clause
    expect(events).toStrictEqual([
      "PREPARE",
      "QUERY true",
      "CONNECT 1",
      "QUERY true",
      "CONNECT 1",
    ]);
  });

  it('applies the ipc extraction options to arrow results', async () => {
    const ipc = tableToIPC(tableFromArrays({ t: [new Date(0)] }), {})!;
    const connector = {
      async query() {
        return ipc;
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector, {
      logger: null,
      ipc: { useDate: false },
      preagg: { enabled: false }
    });

    const table = await coord.query('SELECT t FROM foo', { type: 'arrow' });

    expect(table.getChild('t').at(0)).toBe(0);
  });

  it('uses a custom cache object', async () => {
    const connector = {
      async query(req: JSONQueryRequest) {
        return { sql: req.sql };
      },
    } as unknown as Connector;

    const keys: string[] = [];
    const entries = new Map<string, unknown>();
    const cache: Cache = {
      get: key => entries.get(key),
      set: (key, value) => {
        keys.push(key);
        entries.set(key, value);
        return value;
      },
      clear: () => entries.clear()
    };

    const coord = new Coordinator(connector, {
      logger: null,
      cache,
      preagg: { enabled: false }
    });

    const result = await coord.query('SELECT 1', { type: 'json' });

    expect(result).toStrictEqual({ sql: 'SELECT 1' });
    expect(keys).toContain('SELECT 1');
    expect(entries.get('SELECT 1')).toStrictEqual({ sql: 'SELECT 1' });
  });
});
