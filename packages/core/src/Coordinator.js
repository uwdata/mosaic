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

  logger(logger) {
    if (arguments.length) {
      this._logger = logger || voidLogger();
      this.manager.logger(this._logger);
    }
    return this._logger;
  }

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

  databaseConnector(db) {
    return this.manager.connector(db);
  }

  // -- Query Management ----

  cancel(requests) {
    this.manager.cancel(requests);
  }

  exec(query, { priority = Priority.Normal } = {}) {
    query = Array.isArray(query) ? query.join(';\n') : query;
    return this.manager.request({ type: 'exec', query }, priority);
  }

  query(query, {
    type = 'arrow',
    cache = true,
    priority = Priority.Normal,
    ...options
  } = {}) {
    return this.manager.request({ type, query, cache, options }, priority);
  }

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

  updateClient(client, query, priority = Priority.Normal) {
    client.queryPending();
    return this.query(query, { priority }).then(
      data => client.queryResult(data).update(),
      err => { client.queryError(err); this._logger.error(err); }
    );
  }

  requestQuery(client, query) {
    this.dataCubeIndexer.clear();
    return query
      ? this.updateClient(client, query)
      : client.update();
  }

  /**
   * Connect a client to the coordinator.
   * @param {import('./MosaicClient.js').MosaicClient} client the client to disconnect
   */
  async connect(client) {
    const { clients } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.add(client); // mark as connected
    client.coordinator = this;

    // retrieve field statistics
    const fields = client.fields();
    if (fields?.length) {
      client.fieldInfo(await queryFieldInfo(this, fields));
    }

    // connect filter selection
    connectSelection(this, client.filterBy, client);

    client.requestQuery();
  }

  /**
   * Disconnect a client from the coordinator.
   *
   * @param {import('./MosaicClient.js').MosaicClient} client the client to disconnect
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
 * Connect a selection-client pair to process updates.
 * @param {Coordinator} mc
 * @param {import('./Selection.js').Selection} selection
 * @param {import('./MosaicClient.js').MosaicClient} client
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
 * Activate a selection, potentially precomputing optimizations.
 * @param {Coordinator} mc
 * @param {import('./Selection.js').Selection} selection
 * @param {import('./util/selection-types.js').SelectionClause} clause
 */
function activateSelection(mc, selection, clause) {
  const { dataCubeIndexer, filterGroups } = mc;
  if (dataCubeIndexer) {
    const { clients } = filterGroups.get(selection);
    for (const client of clients) {
      dataCubeIndexer.index(client, selection, clause);
    }
  }
}

/**
 * Process an updated selection value, querying filtered data for any
 * associated clients.
 * @param {Coordinator} mc
 * @param {import('./Selection.js').Selection} selection
 * @returns {Promise} A Promise that resolves when the update completes.
 */
function updateSelection(mc, selection) {
  const { dataCubeIndexer, filterGroups } = mc;
  const { clients } = filterGroups.get(selection);
  const { active } = selection;
  return Promise.allSettled(Array.from(clients).map(client => {
    const info = dataCubeIndexer.index(client, selection, active);
    if (!info?.skip) {
      // @ts-ignore
      const query = info?.query(active.predicate)
        ?? client.query(selection.predicate(client));
      return mc.updateClient(client, query);
    }
  }));
}
