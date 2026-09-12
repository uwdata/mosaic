import { type Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { count, Query } from '@uwdata/mosaic-sql';
import { describe, it, expect } from 'vitest';
import { type ArrowQueryRequest, clausePoint, type Connector, Coordinator, coordinator, makeClient, Selection } from '../src/index.js';
import { heldConnector } from './util/held-connector.js';
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
    const { connector, requests } = heldConnector();
    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false
    });
    const results: string[] = [];
    const row = (i: number) => tableToIPC(tableFromArrays({ i: [i] }), {})!;
    const client = (name: string) => new TestClient(null, undefined, {
      queryResult(data: Table) {
        results.push(name + data.get(0)!.i);
        return this;
      }
    });
    const a = client('a');
    const b = client('b');

    coord.updateClient(a, 'SELECT 0');
    coord.updateClient(b, 'SELECT 1');
    coord.updateClient(a, 'SELECT 2');
    expect(requests).toHaveLength(3);

    // a's second result waits for its first
    requests[2].resolve(row(2));
    await wait();
    expect(results).toEqual([]);

    // b does not wait for a
    requests[1].resolve(row(1));
    await wait();
    expect(results).toEqual(['b1']);

    requests[0].resolve(row(0));
    await wait();
    expect(results).toEqual(['b1', 'a0', 'a2']);
  });


  it('queries a pre-aggregated table only after it is created', async () => {
    const { connector, requests } = heldConnector();
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
    await wait();
    requests[0].resolve([]);
    await client.pending;

    const preagg = () => requests.filter(r => r.sql.includes('"mosaic"'));
    filterBy.update(clausePoint('dim', 'b', { source: {} }));
    await wait();
    expect(preagg().map(r => r.sql)).toEqual(['CREATE SCHEMA IF NOT EXISTS "mosaic"']);

    preagg()[0].resolve(null);
    await wait();
    expect(preagg()).toHaveLength(2);
    expect(preagg()[1].sql).toMatch(/^CREATE TABLE/);

    preagg()[1].resolve(null);
    await wait();
    expect(preagg()).toHaveLength(3);
    expect(preagg()[2].sql).toMatch(/^SELECT/);
  });

  it('creates the schema again after the connector changes', async () => {
    const first = heldConnector();
    const coord = new Coordinator(first.connector, {
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
    await wait();
    first.requests[0].resolve([]);
    await client.pending;

    filterBy.update(clausePoint('dim', 'a', { source: {} }));
    await wait();
    // schema create, table create, then the pre-aggregated select
    for (let i = 0; i < 3; ++i) {
      first.requests.at(-1)!.resolve([]);
      await wait();
    }

    const second = heldConnector();
    coord.databaseConnector(second.connector);
    coord.preaggregator.clear();
    filterBy.update(clausePoint('dim', 'b', { source: {} }));
    await wait();

    expect(second.requests.map(r => r.sql)).toEqual(['CREATE SCHEMA IF NOT EXISTS "mosaic"']);
  });


  it('keeps at most maxPendingUpdates selection updates in flight per client', async () => {
    const { connector, requests } = heldConnector();
    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false,
      preagg: { enabled: false },
      maxPendingUpdates: 2
    });
    const filterBy = Selection.single();
    const client = new TestClient(Query.from('t').select('x'), filterBy);
    coord.connect(client);
    await wait();
    requests[0].resolve([]);
    await client.pending;
    const sent = () => requests.slice(1).map(r => r.sql);

    // brush moves arrive as separate events
    for (const value of [1, 2, 3, 4]) {
      filterBy.update(clausePoint('x', value, { source: {} }));
      await wait();
    }

    // two updates leave, the rest wait
    expect(sent()).toHaveLength(2);
    expect(sent()[0]).toContain('IN (1)');
    expect(sent()[1]).toContain('IN (2)');

    // a freed slot queries the newest value only
    requests[1].resolve([]);
    await wait();
    expect(sent()).toHaveLength(3);
    expect(sent()[2]).toContain('IN (4)');

    requests[2].resolve([]);
    requests[3].resolve([]);
    await wait();
    expect(sent()).toHaveLength(3);
  });


  it('stops re-requesting updates for a disconnected client', async () => {
    const { connector, requests } = heldConnector();
    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const filterBy = Selection.single();
    const client = new TestClient(Query.from('t').select('x'), filterBy);
    coord.connect(client);
    await wait();
    requests[0].resolve([]);
    await client.pending;

    filterBy.update(clausePoint('x', 1, { source: {} }));
    await wait();
    filterBy.update(clausePoint('x', 2, { source: {} }));
    await wait();
    coord.disconnect(client);
    requests[1].resolve([]);
    await wait();

    expect(requests).toHaveLength(2);
  });

  it('logs a failing selection update instead of leaving it unhandled', async () => {
    const errors: unknown[] = [];
    const connector = { async query() { return []; } } as unknown as Connector;
    const coord = new Coordinator(connector, {
      logger: { error: (e: unknown) => errors.push(e), warn() {}, info() {}, log() {}, debug() {}, group() {}, groupCollapsed() {}, groupEnd() {} },
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const filterBy = Selection.single();
    const client = new TestClient(Query.from('t').select('x'), filterBy);
    coord.connect(client);
    await client.pending;
    client.query = () => { throw new Error('bad query'); };

    filterBy.update(clausePoint('x', 1, { source: {} }));
    await wait();

    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe('bad query');
  });


  it('does not skip a deferred update because the client became the active source', async () => {
    const { connector, requests } = heldConnector();
    const coord = new Coordinator(connector, {
      logger: null,
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const filterBy = Selection.crossfilter();
    const a = new TestClient(Query.from('t').select('x'), filterBy);
    const b = new TestClient(Query.from('t').select('y'), filterBy);
    coord.connect(a);
    coord.connect(b);
    await wait();
    requests.forEach(r => r.resolve([]));
    await Promise.all([a.pending, b.pending]);
    const initial = requests.length;
    const sent = () => requests.slice(initial).map(r => r.sql);

    // a brushes twice; b's first update is in flight when the second arrives
    filterBy.update(clausePoint('x', 1, { source: a }));
    await wait();
    filterBy.update(clausePoint('x', 2, { source: a }));
    await wait();
    // b becomes the active source before its slot frees
    filterBy.update(clausePoint('y', 5, { source: b }));
    await wait();
    requests.slice(initial).forEach(r => r.resolve([]));
    await wait();

    // b still learns about x = 2; a queries y = 5
    expect(sent().filter(sql => sql.includes('"y"') && sql.includes('IN (2)'))).toHaveLength(1);
    expect(sent().filter(sql => sql.includes('"x"') && sql.includes('IN (5)'))).toHaveLength(1);
  });

  it('awaits initializing clients before selection updates', async () => {
    const events: string[] = [];

    // Mock the connector
    const connector = {
      async query(req: ArrowQueryRequest) {
        const index = req.sql.includes("WHERE") ? 1 : 0;
        events.push(`CONNECT ${index}`);
        return tableToIPC(tableFromArrays({ index: [index] }), {})!;
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
});
