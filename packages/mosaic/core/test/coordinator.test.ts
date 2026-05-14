import { Query } from '@uwdata/mosaic-sql';
import { describe, it, expect, vi } from 'vitest';
import { clausePoint, type Connector, Coordinator, coordinator, type JSONQueryRequest, type Logger, makeClient, observeLogger, Selection } from '../src/index.js';
import { QueryResult, QueryState } from '../src/util/query-result.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
  };
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
    const promises: QueryResult[] = [];

    // Mock the connector
    const connector = {
      async query() {
        const promise = new QueryResult();
        promises.push(promise);
        return promise;
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector);

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
    promises.at(3)!.fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.pending);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(1)!.fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.ready);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(0)!.fulfill(0);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(2);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(2)!.fulfill(0);
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
        const index = req.sql.includes('WHERE') ? 1 : 0;
        events.push(`CONNECT ${index}`);
        return { index };
      },
    } as unknown as Connector;

    // disable cache to ensure routing through connector
    const coord = new Coordinator(connector, {
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
        events.push('PREPARE');
      },
      query(filter = []) {
        events.push(`QUERY ${prepared}`);
        return Query.select('*').from('foo').where(filter);
      }
    });

    // fire selection update
    filterBy.update(clausePoint('foo', 1, { source: {} }));

    // await initial query, then selection update
    await client.pending;
    await client.pending;

    // prepare should be first
    // query calls should come post-initialization
    // all queries should include filter clause
    expect(events).toStrictEqual([
      'PREPARE',
      'QUERY true',
      'CONNECT 1',
      'QUERY true',
      'CONNECT 1',
    ]);
  });

  it('observeLogger reproduces old-style query logging and supports unsubscribe', async () => {
    const connector = {
      async query() {
        return [{ value: 1 }];
      },
    } as unknown as Connector;

    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      preagg: { enabled: false },
    });

    const logger = createLogger();

    const unobserve = observeLogger(coord, logger);

    await coord.query('SELECT 1', { cache: false });

    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.groupCollapsed).toHaveBeenCalledWith('query SELECT 1');

    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('SELECT 1', expect.any(String));

    expect(logger.groupEnd).toHaveBeenCalledTimes(1);

    unobserve();

    await coord.query('SELECT 1', { cache: false });

    // no additional logger calls after unsubscribe
    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
  });

  it('supports legacy coordinator logger configuration through the event bus', async () => {
    const connector = {
      async query() {
        return [{ value: 1 }];
      },
    } as unknown as Connector;

    const logger = createLogger();
    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      logger,
      preagg: { enabled: false },
    });

    expect(coord.logger()).toBe(logger);

    await coord.query('SELECT 1', { cache: false });

    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);

    const nextLogger = createLogger();
    expect(coord.logger(nextLogger)).toBe(nextLogger);

    await coord.query('SELECT 2', { cache: false });

    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
    expect(nextLogger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(nextLogger.log).toHaveBeenCalledTimes(1);
    expect(nextLogger.groupEnd).toHaveBeenCalledTimes(1);

    expect(coord.logger(null)).toBeNull();

    await coord.query('SELECT 3', { cache: false });

    expect(nextLogger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(nextLogger.log).toHaveBeenCalledTimes(1);
    expect(nextLogger.groupEnd).toHaveBeenCalledTimes(1);
  });
});
