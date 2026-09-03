import { count, Query } from '@uwdata/mosaic-sql';
import { describe, it, expect } from 'vitest';
import { clausePoint, type Connector, Coordinator, coordinator, type JSONQueryRequest, makeClient, Selection } from '../src/index.js';
import { QueryResult } from '../src/util/query-result.js';
import { TestClient } from './util/test-client.js';

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

  it('applies results per client in request order', async () => {
    const promises: QueryResult[] = [];

    // Mock the connector
    const connector = {
      async query() {
        const promise = new QueryResult();
        promises.push(promise);
        return promise;
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false
    });
    const results: string[] = [];
    const client = (name: string) => new TestClient(null, undefined, {
      queryResult(data: string) {
        results.push(name + data);
        return this;
      }
    });
    const a = client('a');
    const b = client('b');

    coord.updateClient(a, 'SELECT 0');
    coord.updateClient(b, 'SELECT 1');
    coord.updateClient(a, 'SELECT 2');
    expect(promises).toHaveLength(3);

    // a's second result waits for its first
    promises[2].fulfill('2');
    await wait();
    expect(results).toEqual([]);

    // b does not wait for a
    promises[1].fulfill('1');
    await wait();
    expect(results).toEqual(['b1']);

    promises[0].fulfill('0');
    await wait();
    expect(results).toEqual(['b1', 'a0', 'a2']);
  });

  it('queries a pre-aggregated table only after it is created', async () => {
    const sent: string[] = [];
    const execs: ((value: unknown) => void)[] = [];

    // Mock the connector: hold exec requests, answer reads immediately
    const connector = {
      query(req: JSONQueryRequest) {
        sent.push(req.sql);
        return req.type === 'exec'
          ? new Promise(resolve => execs.push(resolve))
          : Promise.resolve([]);
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false
    });
    const filterBy = Selection.single({ cross: true });
    const client = new TestClient(
      Query.from('testData').select({ measure: count() }),
      filterBy
    );
    coord.connect(client);
    await client.pending;

    const preagg = (sql: string) => sql.includes('"mosaic"');
    filterBy.update(clausePoint('dim', 'b', { source: {} }));
    await wait();
    expect(sent.filter(preagg)).toEqual(['CREATE SCHEMA IF NOT EXISTS "mosaic"']);

    execs[0](null);
    await wait();
    expect(sent.filter(preagg)).toHaveLength(2);
    expect(sent.at(-1)).toMatch(/^CREATE TABLE/);

    execs[1](null);
    await wait();
    expect(sent.filter(preagg)).toHaveLength(3);
    expect(sent.at(-1)).toMatch(/^SELECT/);
  });

  it('keeps at most updateWindow selection updates in flight per client', async () => {
    const sent: string[] = [];
    const resolvers: ((value: unknown) => void)[] = [];

    // Mock the connector: hold every query until resolved by the test
    const connector = {
      query(req: JSONQueryRequest) {
        sent.push(req.sql);
        return new Promise(resolve => resolvers.push(resolve));
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false,
      preagg: { enabled: false },
      updateWindow: 2
    });
    const filterBy = Selection.single();
    const client = new TestClient(Query.from('t').select('x'), filterBy);
    coord.connect(client);
    await wait();
    resolvers.shift()!([]);
    await client.pending;
    sent.length = 0;

    // brush moves arrive as separate events
    for (const value of [1, 2, 3, 4]) {
      filterBy.update(clausePoint('x', value, { source: {} }));
      await wait();
    }

    // two updates leave, the rest wait
    expect(sent).toHaveLength(2);
    expect(sent[0]).toContain('IN (1)');
    expect(sent[1]).toContain('IN (2)');

    // a freed slot queries the newest value only
    resolvers.shift()!([]);
    await wait();
    expect(sent).toHaveLength(3);
    expect(sent[2]).toContain('IN (4)');

    resolvers.shift()!([]);
    resolvers.shift()!([]);
    await wait();
    expect(sent).toHaveLength(3);
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
});
