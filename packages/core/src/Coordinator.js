import { socketConnector } from './connectors/socket.js';
import { DataCubeIndexer } from './DataCubeIndexer.js';
import { QueryManager, Priority } from './QueryManager.js';
import { queryFieldInfo } from './util/field-info.js';
import { voidLogger } from './util/void-logger.js';

/**
 * The singleton Coordinator instance.
 * @type {Coordinator}
 */
let _instance;

/**
 * Set or retrieve the coordinator instance.
 * @param {Coordinator} [instance] the coordinator instance to set
 * @returns {Coordinator} the coordinator instance
 */
export function coordinator(instance) {
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
 * including query caching, consolidation, and data cube indexing.
 * @param {*} [db] Database connector. Defaults to a web socket connection.
 * @param {object} [options] Coordinator options.
 * @param {*} [options.logger=console] The logger to use, defaults to `console`.
 * @param {*} [options.manager] The query manager to use.
 * @param {boolean} [options.cache=true] Boolean flag to enable/disable query caching.
 * @param {boolean} [options.consolidate=true] Boolean flag to enable/disable query consolidation.
 * @param {object} [options.indexes] Data cube indexer options.
 */
export class Coordinator {
  constructor(db = socketConnector(), {
    logger = console,
    manager = new QueryManager(),
    cache = true,
    consolidate = true,
    indexes = {}
  } = {}) {
    this.manager = manager;
    this.manager.cache(cache);
    this.manager.consolidate(consolidate);
    this.dataCubeIndexer = new DataCubeIndexer(this, indexes);
    this.logger(logger);
    this.databaseConnector(db);
    this.clear();
  }

  /**
   * Clear the coordinator state.
   * @param {object} [options] Options object.
   * @param {boolean} [options.clients=true] If true, disconnect all clients.
   * @param {boolean} [options.cache=true] If true, clear the query cache.
   */
  clear({ clients = true, cache = true } = {}) {
    this.manager.clear();
    if (clients) {
      this.filterGroups?.forEach(group => group.disconnect());
      this.filterGroups = new Map;
      this.clients?.forEach(client => this.disconnect(client));
      this.clients = new Set;
    }
    if (cache) this.manager.cache().clear();
  }

  /**
   * Get or set the database connector.
   * @param {*} [db] The database connector to use.
   * @returns The current database connector.
   */
  databaseConnector(db) {
    return this.manager.connector(db);
  }

  /**
   * Get or set the logger.
   * @param {*} logger  The logger to use.
   * @returns The current logger
   */
  logger(logger) {
    if (arguments.length) {
      this._logger = logger || voidLogger();
      this.manager.logger(this._logger);
    }
    return this._logger;
  }

  // -- Query Management ----

  /**
   * Cancel previosuly submitted query requests. These queries will be
   * canceled if they are queued but have not yet been submitted.
   * @param {import('./util/query-result.js').QueryResult[]} requests An array
   *  of query result objects, such as those returned by the `query` method.
   */
  cancel(requests) {
    this.manager.cancel(requests);
  }

  /**
   * Issue a query for which no result (return value) is needed.
   * @param {import('@uwdata/mosaic-sql').Query | string} query The query.
   * @param {object} [options] An options object.
   * @param {number} [options.priority] The query priority, defaults to
   *  `Priority.Normal`.
   * @returns {import('./util/query-result.js').QueryResult} A query result
   *  promise.
   */
  exec(query, { priority = Priority.Normal } = {}) {
    query = Array.isArray(query) ? query.join(';\n') : query;
    return this.manager.request({ type: 'exec', query }, priority);
  }

  /**
   * Issue a query to the backing database. The submitted query may be
   * consolidate with other queries and its results may be cached.
   * @param {import('@uwdata/mosaic-sql').Query | string} query The query.
   * @param {object} [options] An options object.
   * @param {'arrow' | 'json'} [options.type] The query result format type.
   * @param {boolean} [options.cache=true] If true, cache the query result.
   * @param {number} [options.priority] The query priority, defaults to
   *  `Priority.Normal`.
   * @returns {import('./util/query-result.js').QueryResult} A query result
   *  promise.
   */
  query(query, {
    type = 'arrow',
    cache = true,
    priority = Priority.Normal,
    ...options
  } = {}) {
    return this.manager.request({ type, query, cache, options }, priority);
  }

  /**
   * Issue a query to prefetch data for later use. The query result is cached
   * for efficient future access.
   * @param {import('@uwdata/mosaic-sql').Query | string} query The query.
   * @param {object} [options] An options object.
   * @param {'arrow' | 'json'} [options.type] The query result format type.
   * @returns {import('./util/query-result.js').QueryResult} A query result
   *  promise.
   */
  prefetch(query, options = {}) {
    return this.query(query, { ...options, cache: true, priority: Priority.Low });
  }

  createBundle(name, queries, priority = Priority.Low) {
    const options = { name, queries };
    return this.manager.request({ type: 'create-bundle', options }, priority);
  }

  loadBundle(name, priority = Priority.High) {
    const options = { name };
    return this.manager.request({ type: 'load-bundle', options }, priority);
  }

  // -- Client Management ----

  /**
   * Update client data by submitting the given query and returning the
   * data (or error) to the client.
   * @param {import('./MosaicClient.js').MosaicClient} client A Mosaic client.
   * @param {import('@uwdata/mosaic-sql').Query | string} query The data query.
   * @param {number} [priority] The query priority.
   * @returns {Promise} A Promise that resolves upon completion of the update.
   */
  updateClient(client, query, priority = Priority.Normal) {
    client.queryPending();
    return this.query(query, { priority })
      .then(
        data => client.queryResult(data).update(),
        err => { this._logger.error(err); client.queryError(err); }
      )
      .catch(err => this._logger.error(err));
  }

  /**
   * Issue a query request for a client. If the query is null or undefined,
   * the client is simply updated. Otherwise `updateClient` is called. As a
   * side effect, this method clears the current data cube indexer state.
   * @param {import('./MosaicClient.js').MosaicClient} client The client
   *  to update.
   * @param {import('@uwdata/mosaic-sql').Query | string | null} [query]
   *  The query to issue.
   */
  requestQuery(client, query) {
    this.dataCubeIndexer.clear();
    return query
      ? this.updateClient(client, query)
      : client.update();
  }

  /**
   * Connect a client to the coordinator.
   * @param {import('./MosaicClient.js').MosaicClient} client The Mosaic
   *  client to connect.
   */
  async connect(client) {
    const { clients } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.add(client); // mark as connected
    client.coordinator = this;

    // initialize client lifecycle
    this.initializeClient(client);

    // connect filter selection
    connectSelection(this, client.filterBy, client);
  }

  async initializeClient(client) {
    // retrieve field statistics
    const fields = client.fields();
    if (fields?.length) {
      client.fieldInfo(await queryFieldInfo(this, fields));
    }

    // request data query
    return client.requestQuery();
  }

  /**
   * Disconnect a client from the coordinator.
   * @param {import('./MosaicClient.js').MosaicClient} client The Mosaic
   *  client to disconnect.
   */
  disconnect(client) {
    const { clients, filterGroups } = this;
    if (!clients.has(client)) return;
    clients.delete(client);
    client.coordinator = null;

    const group = filterGroups.get(client.filterBy);
    if (group) {
      group.clients.delete(client);
    }
  }
}

/**
 * Connect a selection-client pair to the coordinator to process updates.
 * @param {Coordinator} mc The Mosaic coordinator.
 * @param {import('./Selection.js').Selection} selection A selection.
 * @param {import('./MosaicClient.js').MosaicClient} client A Mosiac
 *  client that is filtered by the given selection.
 */
function connectSelection(mc, selection, client) {
  if (!selection) return;
  let entry = mc.filterGroups.get(selection);
  if (!entry) {
    const activate = clause => activateSelection(mc, selection, clause);
    const value = () => updateSelection(mc, selection);

    selection.addEventListener('activate', activate);
    selection.addEventListener('value', value);

    entry = {
      selection,
      clients: new Set,
      disconnect() {
        selection.removeEventListener('activate', activate);
        selection.removeEventListener('value', value);
      }
    };
    mc.filterGroups.set(selection, entry);
  }
  entry.clients.add(client);
}

/**
 * Activate a selection, providing a clause indicative of potential
 * next updates. Activation provides a preview of likely next events,
 * enabling potential precomputation to optimize updates.
 * @param {Coordinator} mc The Mosaic coordinator.
 * @param {import('./Selection.js').Selection} selection A selection.
 * @param {import('./util/selection-types.js').SelectionClause} clause A
 *  selection clause representative of the activation.
 */
function activateSelection(mc, selection, clause) {
  const { dataCubeIndexer, filterGroups } = mc;
  const { clients } = filterGroups.get(selection);
  for (const client of clients) {
    dataCubeIndexer.index(client, selection, clause);
  }
}

/**
 * Process an updated selection value, querying filtered data for any
 * associated clients.
 * @param {Coordinator} mc The Mosaic coordinator.
 * @param {import('./Selection.js').Selection} selection A selection.
 * @returns {Promise} A Promise that resolves when the update completes.
 */
function updateSelection(mc, selection) {
  const { dataCubeIndexer, filterGroups } = mc;
  const { clients } = filterGroups.get(selection);
  const { active } = selection;
  return Promise.allSettled(Array.from(clients, client => {
    const info = dataCubeIndexer.index(client, selection, active);
    const filter = info ? null : selection.predicate(client);

    // skip due to cross-filtering
    if (info?.skip || (!info && !filter)) return;

    // @ts-ignore
    const query = info?.query(active.predicate) ?? client.query(filter);
    return mc.updateClient(client, query);
  }));
}
