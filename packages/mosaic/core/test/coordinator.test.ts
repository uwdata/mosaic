import { tableFromArrays } from '@uwdata/flechette';
import { Query } from '@uwdata/mosaic-sql';
import { describe, it, expect, vi } from 'vitest';
import { clausePoint, type Connector, Coordinator, coordinator, EventType, type Logger, makeClient, MosaicErrorEvent, MosaicQueryEndEvent, MosaicQueryStartEvent, observeLogger, type ArrowQueryRequest, Selection } from '../src/index.js';
import { QueryError } from '../src/util/query-error.js';
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
      async query(req: ArrowQueryRequest) {
        const index = req.sql.includes('WHERE') ? 1 : 0;
        events.push(`CONNECT ${index}`);
        return tableFromArrays({ index: [index] });
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

  it('observeLogger logs queries as groups and stops on unsubscribe', async () => {
    const connector = {
      async query() {
        return tableFromArrays({ value: [1] });
      }
    } as unknown as Connector;
    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const logger = createLogger();
    const unobserve = observeLogger(coord, logger);

    await coord.query('SELECT 1');

    expect(logger.groupCollapsed).toHaveBeenCalledWith('query SELECT 1');
    expect(logger.log).toHaveBeenCalledWith('SELECT 1', expect.any(String));
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);

    unobserve();
    await coord.query('SELECT 2');

    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
  });

  it('observeLogger closes the group and logs the error for failed queries', async () => {
    const error = new Error('boom');
    const connector = {
      async query() {
        throw error;
      }
    } as unknown as Connector;
    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const logger = createLogger();
    observeLogger(coord, logger);

    await expect(coord.query('SELECT fail')).rejects.toThrow('boom');

    expect(logger.groupCollapsed).toHaveBeenCalledWith('query SELECT fail');
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('observeLogger derives elapsed time from event timestamps', () => {
    const coord = new Coordinator({} as Connector, { preagg: { enabled: false } });
    const logger = createLogger();
    observeLogger(coord, logger);
    const lifecycle = { queryId: 1, query: 'SELECT timed', cached: false };

    coord.eventBus.emit(EventType.QueryStart, new MosaicQueryStartEvent({ ...lifecycle, timestamp: 100 }));
    coord.eventBus.emit(EventType.QueryEnd, new MosaicQueryEndEvent({ ...lifecycle, status: 'success', timestamp: 123.45 }));

    expect(logger.log).toHaveBeenCalledWith('SELECT timed', '23.5');
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
  });

  it('observeLogger ignores query end events it did not see start', () => {
    const coord = new Coordinator({} as Connector, { preagg: { enabled: false } });
    const logger = createLogger();
    observeLogger(coord, logger);

    coord.eventBus.emit(EventType.QueryEnd, new MosaicQueryEndEvent({
      queryId: 1, query: 'SELECT unmatched', cached: false, status: 'success'
    }));

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.groupEnd).not.toHaveBeenCalled();
  });

  it('emits a single error event per failed client update', async () => {
    const connector = {
      async query() {
        throw new Error('boom');
      }
    } as unknown as Connector;
    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      preagg: { enabled: false }
    });
    const errors: MosaicErrorEvent[] = [];
    coord.eventBus.addEventListener(EventType.Error, event => { errors.push(event); });

    const client = makeClient({
      coordinator: coord,
      query: () => Query.select('*').from('foo')
    });
    await client.pending;

    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBeInstanceOf(QueryError);
    expect(errors[0].message).toContain('boom');
  });
});
