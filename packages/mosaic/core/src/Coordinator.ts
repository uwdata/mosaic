/* eslint-disable @typescript-eslint/no-explicit-any */
import { SocketConnector } from './connectors/socket.js';
import { type Connector } from './connectors/Connector.js';
import { PreAggregator, type PreAggregateOptions } from './preagg/PreAggregator.js';
import { voidLogger } from './util/void-logger.js';
import { QueryManager, Priority } from './QueryManager.js';
import { type Selection } from './Selection.js';
import { type Logger, type QueryType } from './types.js';
import { type QueryResult } from './util/query-result.js';
import { type MosaicClient } from './MosaicClient.js';
import { type SelectionClause } from './SelectionClause.js';
import { MaybeArray } from '@uwdata/mosaic-sql';
import { Table } from '@uwdata/flechette';
import { QueryError } from './util/query-error.js';

interface FilterGroupEntry {
  selection: Selection;
  clients: Set<MosaicClient>;
  disconnect(): void;
}

/**
 * The singleton Coordinator instance.
 */
let _instance: Coordinator;

/**
 * Set or retrieve the coordinator instance.
 * @param instance The coordinator instance to set
 * @returns The coordinator instance
 */
export function coordinator(
  instance?: Coordinator
): Coordinator {
  if (instance) {
    _instance = instance;
  } else if (_instance == null) {
    _instance = new Coordinator();
  }
  return _instance;
}

/**
 * A Mosaic Coordinator manages all database communication for clients and
 * handles selection updates. The Coordinator also performs optimizations
 * including query caching, consolidation, and pre-aggregation.
 */
export class Coordinator {
  public manager: QueryManager;
  public preaggregator: PreAggregator;
  public clients = new Set<MosaicClient>;
  public filterGroups = new Map<Selection, FilterGroupEntry>;
  protected _logger: Logger = voidLogger();
  private lastUpdate = new WeakMap<MosaicClient, Promise<unknown>>();
  /** How many selection updates a client may have in flight. */
  public updateWindow: number;

  /**
   * @param db Database connector. Defaults to a web socket connection.
   * @param options Coordinator options.
   * @param options.logger The logger to use, defaults to `console`.
   * @param options.manager The query manager to use.
   * @param options.cache Boolean flag to enable/disable query caching.
   * @param options.consolidate Boolean flag to enable/disable query consolidation.
   * @param options.preagg Options for the Pre-aggregator.
   * @param options.updateWindow How many selection updates a client may have
   *  in flight, capped by the connector's concurrency. Defaults to 1.
   */
  constructor(
    db: Connector = new SocketConnector(),
    options: {
      logger?: Logger | null;
      manager?: QueryManager;
      cache?: boolean;
      consolidate?: boolean;
      preagg?: PreAggregateOptions;
      updateWindow?: number;
    } = {}
  ) {
    const {
      logger = console,
      manager = new QueryManager(),
      cache = true,
      consolidate = true,
      preagg = {},
      updateWindow = 1
    } = options;
    this.updateWindow = updateWindow;
    this.manager = manager;
    this.manager.cache(cache);
    this.manager.consolidate(consolidate);
    this.databaseConnector(db);
    this.logger(logger);
    this.clear();
    this.preaggregator = new PreAggregator(this, preagg);
  }

  /**
   * Clear the coordinator state.
   * @param options Options object.
   * @param options.clients If true, disconnect all clients.
   * @param options.cache If true, clear the query cache.
   */
  clear(options: { clients?: boolean; cache?: boolean } = {}) {
    const { clients = true, cache = true } = options;
    this.manager.clear();
    if (clients) {
      this.filterGroups?.forEach(group => group.disconnect());
      this.filterGroups = new Map;
      this.clients?.forEach(client => this.disconnect(client));
      this.clients = new Set;
    }
    if (cache) this.manager.cache()!.clear();
  }

  /**
   * Get or set the database connector.
   * @param db The database connector to use.
   * @returns The current database connector.
   */
  databaseConnector(): Connector | null;
  databaseConnector(db: Connector): Connector;
  databaseConnector(db?: Connector): Connector | null {
    return db
      ? this.manager.connector(db)
      : this.manager.connector();
  }

  /**
   * Get or set the logger.
   * @param logger The logger to use.
   * @returns The current logger
   */
  logger(logger?: Logger | null): Logger {
    if (arguments.length) {
      this._logger = logger || voidLogger();
      this.manager.logger(this._logger);
    }
    return this._logger!;
  }

  // -- Query Management ----

  /**
   * Cancel previously submitted query requests. These queries will be
   * canceled if they are queued but have not yet been submitted.
   * @param requests An array of query result objects, such as those returned by the `query` method.
   */
  cancel(requests: QueryResult[]) {
    this.manager.cancel(requests);
  }

  /**
   * Issue a query for which no result (return value) is needed.
   * @param query The query or an array of queries. Each query should be either a Query builder object or a SQL string.
   * @param options An options object.
   * @param options.priority The query priority, defaults to `Priority.Normal`.
   * @returns A query result promise.
   */
  exec(
    query: MaybeArray<QueryType>,
    options: { priority?: number } = {}
  ): QueryResult {
    const { priority = Priority.Normal } = options;
    return this.manager.request({ type: 'exec', query }, priority);
  }

  /**
   * Issue a query to the backing database. The submitted query may be
   * consolidate with other queries and its results may be cached.
   * @param query The query as either a Query builder object or a SQL string.
   * @param options An options object.
   * @param options.type The query result format type.
   * @param options.cache If true, cache the query result client-side within the QueryManager.
   * @param options.persist If true, request the database server to persist a cached query server-side.
   * @param options.priority The query priority, defaults to `Priority.Normal`.
   * @returns A query result promise.
   */
  query(
    query: QueryType,
    options?: {
      type?: 'arrow';
      cache?: boolean;
      persist?: boolean;
      priority?: number;
      [key: string]: unknown;
    }
  ): QueryResult<Table>;
  query(
    query: QueryType,
    options?: {
      type?: 'json';
      cache?: boolean;
      persist?: boolean;
      priority?: number;
      [key: string]: unknown;
    }
  ): QueryResult<unknown>;
  query(
    query: QueryType,
    options: {
      type?: 'arrow' | 'json';
      cache?: boolean;
      persist?: boolean;
      priority?: number;
      [key: string]: unknown;
    } = {}
  ): QueryResult<any> {
    const {
      type = 'arrow',
      cache = true,
      priority = Priority.Normal,
      ...otherOptions
    } = options;
    return this.manager.request({ type, query, cache, options: otherOptions }, priority);
  }

  /**
   * Issue a query to prefetch data for later use. The query result is cached
   * for efficient future access.
   * @param query The query as either a Query builder object or a SQL string.
   * @param options An options object.
   * @param options.type The query result format type.
   * @returns A query result promise.
   */
  prefetch(
    query: QueryType,
    options?: { type?: 'arrow'; [key: string]: unknown }
  ): QueryResult<Table>
  prefetch(
    query: QueryType,
    options?: { type?: 'json'; [key: string]: unknown }
  ): QueryResult<unknown>
  prefetch(
    query: QueryType,
    options: any = {}
  ): QueryResult<any> {
    return this.query(query, { ...options, cache: true, priority: Priority.Low });
  }

  // -- Client Management ----

  /**
   * Update client data by submitting the given query and returning the
   * data (or error) to the client. A client receives results in the order
   * its queries were issued, independent of other clients.
   * @param client A Mosaic client.
   * @param query The data query.
   * @param priority The query priority.
   * @returns A Promise that resolves upon completion of the update.
   */
  updateClient(
    client: MosaicClient,
    query: QueryType,
    priority: number = Priority.Normal
  ): Promise<unknown> {
    client.queryPending();
    const prior = this.lastUpdate.get(client);
    const update = this.query(query, { priority })
      .then(
        async data => {
          await prior;
          return client.queryResult(data).update();
        },
        async err => {
          await prior;
          const e = new QueryError(err, query);
          this._logger?.error(e);
          client.queryError(e);
          return e;
        }
      )
      .catch(err => this._logger?.error(err));
    this.lastUpdate.set(client, update);
    return client._pending = update;
  }

  /**
   * Issue a query request for a client. If the query is null or undefined,
   * the client is simply updated. Otherwise `updateClient` is called. As a
   * side effect, this method clears the current preaggregator state.
   * @param client The client to update.
   * @param query The query to issue.
   */
  requestQuery(client: MosaicClient, query?: QueryType | null): Promise<unknown> {
    this.preaggregator.clear();
    return query
      ? this.updateClient(client, query)
      : Promise.resolve(client.update());
  }

  /**
   * Connect a client to the coordinator.
   * Throws an error if the client is already connected.
   * @param client The Mosaic client to connect.
   */
  connect(client: MosaicClient): void {
    const { clients } = this;

    if (clients?.has(client)) {
      throw new Error('Client already connected.');
    }

    // add client to client set
    clients?.add(client);

    // register coordinator on client instance
    client.coordinator = this;

    // initialize client lifecycle
    client.initialize();

    // connect filter selection
    connectSelection(this, client.filterBy!, client);
  }

  /**
   * Disconnect a client from the coordinator.
   * This method has no effect if the client is already disconnected.
   * @param client The Mosaic client to disconnect.
   */
  disconnect(client: MosaicClient): void {
    const { clients, filterGroups } = this;
    if (!clients?.has(client)) return;
    clients.delete(client);
    client.coordinator = null;

    const group = filterGroups?.get(client.filterBy!);
    if (group) {
      group.clients.delete(client);
    }
  }
}

/**
 * Connect a selection-client pair to the coordinator to process updates.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 * @param client A Mosaic client that is filtered by the given selection.
 */
function connectSelection(
  mc: Coordinator,
  selection: Selection,
  client: MosaicClient
): void {
  if (!selection) return;
  let entry = mc.filterGroups?.get(selection);
  if (!entry) {
    const activate = (clause: SelectionClause) => activateSelection(mc, selection, clause);
    const value = () => updateSelection(mc, selection);

    // @ts-expect-error todo: update selection dispatch types
    selection.addEventListener('activate', activate);
    selection.addEventListener('value', value);

    entry = {
      selection,
      clients: new Set,
      disconnect() {
        // @ts-expect-error todo: update selection dispatch types
        selection.removeEventListener('activate', activate);
        selection.removeEventListener('value', value);
      }
    };
    mc.filterGroups?.set(selection, entry);
  }
  entry.clients.add(client);
}

/**
 * Activate a selection, providing a clause indicative of potential
 * next updates. Activation provides a preview of likely next events,
 * enabling potential precomputation to optimize updates.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 * @param clause A selection clause for the activation.
 */
function activateSelection(
  mc: Coordinator,
  selection: Selection,
  clause: SelectionClause
): void {
  const { preaggregator, filterGroups } = mc;
  const { clients } = filterGroups.get(selection)!;
  for (const client of clients) {
    if (client.enabled) {
      preaggregator.request(client, selection, clause);
    }
  }
}

const selectionUpdates = new WeakMap<MosaicClient, { inflight: number; dirty: boolean }>();

/**
 * Process an updated selection value by updating each associated client.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 */
function updateSelection(mc: Coordinator, selection: Selection): void {
  const { clients } = mc.filterGroups!.get(selection)!;
  for (const client of clients) {
    requestSelectionUpdate(mc, selection, client);
  }
}

/**
 * Update a client for the current value of a selection, keeping at most
 * `updateWindow` updates in flight. While the window is full the request
 * is deferred, and only the newest selection value is queried once a
 * slot frees up. A deferred update is not skipped for a cross-filter
 * source, as the value it missed came from another source.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 * @param client A client filtered by the selection.
 * @param deferred Whether this update was deferred by a full window.
 */
function requestSelectionUpdate(mc: Coordinator, selection: Selection, client: MosaicClient, deferred = false): void {
  let state = selectionUpdates.get(client);
  if (!state) {
    state = { inflight: 0, dirty: false };
    selectionUpdates.set(client, state);
  }
  const window = Math.max(1, Math.min(mc.updateWindow, mc.manager.connector()?.concurrency ?? Infinity));
  if (state.inflight >= window) {
    const { active } = selection;
    if (!active || !selection.skip(client, active)) state.dirty = true;
    return;
  }
  state.inflight += 1;
  const update = updateClientSelection(mc, selection, client, deferred)
    .catch(err => mc.logger().error(err))
    .finally(() => {
      state.inflight -= 1;
      if (state.dirty) {
        state.dirty = false;
        if (mc.filterGroups.get(selection)?.clients.has(client)) {
          requestSelectionUpdate(mc, selection, client, true);
        }
      }
    });
  if (client.initialized) client._pending = update;
}

/**
 * Query filtered data for a client, using pre-aggregation when possible.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 * @param client A client filtered by the selection.
 */
async function updateClientSelection(mc: Coordinator, selection: Selection, client: MosaicClient, noSkip = false): Promise<void> {
  // if client is not enabled, register a request for later
  if (!client.enabled) {
    await client.requestQuery();
    return;
  }

  // if client is initializing, wait for it to complete
  if (!client.initialized) await client.pending;

  // check if we can handle selection update via preaggregation
  const { active } = selection;
  const info = mc.preaggregator.request(client, selection, active);

  if (info?.skip) {
    if (!noSkip) return;
  } else if (info?.result) {
    // query the pre-aggregated table once it exists
    const created = await info.result.then(() => true, () => false);
    if (created) {
      const result = await mc.updateClient(client, info.query(active));
      if (!(result instanceof QueryError)) return;
    }
    // if creation or the update fails, fall through to standard query
    // this safeguards against potential preagg bugs
  }

  const filter = selection.predicate(client, noSkip);
  if (!filter) return;
  await mc.updateClient(client, client.query(filter)!);
}
