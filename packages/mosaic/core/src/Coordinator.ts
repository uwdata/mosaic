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

  /**
   * @param db Database connector. Defaults to a web socket connection.
   * @param options Coordinator options.
   * @param options.logger The logger to use, defaults to `console`.
   * @param options.manager The query manager to use.
   * @param options.cache Boolean flag to enable/disable query caching.
   * @param options.consolidate Boolean flag to enable/disable query consolidation.
   * @param options.preagg Options for the Pre-aggregator.
   */
  constructor(
    db: Connector = new SocketConnector(),
    options: {
      logger?: Logger | null;
      manager?: QueryManager;
      cache?: boolean;
      consolidate?: boolean;
      preagg?: PreAggregateOptions;
    } = {}
  ) {
    const {
      logger = console,
      manager = new QueryManager(),
      cache = true,
      consolidate = true,
      preagg = {}
    } = options;
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
    query = Array.isArray(query) ? query.filter(x => x).join(';\n') : query;
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
    options: {
      type?: 'arrow' | 'json';
      cache?: boolean;
      persist?: boolean;
      priority?: number;
      [key: string]: unknown;
    } = {}
  ): QueryResult {
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
    options: { type?: 'arrow' | 'json'; [key: string]: unknown } = {}
  ): QueryResult {
    return this.query(query, { ...options, cache: true, priority: Priority.Low });
  }

  // -- Client Management ----

  /**
   * Update client data by submitting the given query and returning the()
   * data (or error) to the client.
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
    return client._pending = this.query(query, { priority })
      .then(
        data => client.queryResult(data).update(),
        err => { this._logger?.error(err); client.queryError(err); }
      )
      .catch(err => this._logger?.error(err));
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

/**
 * Process an updated selection value, querying filtered data for any
 * associated clients.
 * @param mc The Mosaic coordinator.
 * @param selection A selection.
 * @returns A Promise that resolves when the update completes.
 */
function updateSelection(
  mc: Coordinator,
  selection: Selection
): Promise<PromiseSettledResult<unknown>[]> {
  const { preaggregator, filterGroups } = mc;
  const { clients } = filterGroups!.get(selection)!;
  const { active } = selection;
  return Promise.allSettled(Array.from(clients, (client: MosaicClient) => {
    if (!client.enabled) return client.requestQuery();
    const info = preaggregator.request(client, selection, active);
    const filter = info ? null : selection.predicate(client);

    // skip due to cross-filtering
    if (info?.skip || (!info && !filter)) return;

    // @ts-expect-error FIXME
    const query = info?.query(active.predicate) ?? client.query(filter);
    return mc.updateClient(client, query);
  }));
}