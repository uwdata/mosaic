import { socketConnector } from './connectors/socket.js';
import { Catalog } from './Catalog.js';
import { FilterGroup } from './FilterGroup.js';
import { QueryManager, Priority } from './QueryManager.js';
import { voidLogger } from './util/void-logger.js';

let _instance;

/**
 * Set or retrieve the coordinator instance.
 *
 * @param {Coordinator} coordinator the coordinator instance to set
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

export class Coordinator {
  constructor(db = socketConnector(), options = {}) {
    this.catalog = new Catalog(this);
    this.manager = options.manager || QueryManager();
    this.logger(options.logger || console);
    this.configure(options);
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

  configure({ cache = true, consolidate = true, indexes = true }) {
    this.manager.cache(cache);
    this.manager.consolidate(consolidate);
    this.indexes = indexes;
  }

  clear({ clients = true, cache = true, catalog = false } = {}) {
    this.manager.clear();
    if (clients) {
      this.clients?.forEach(client => this.disconnect(client));
      this.filterGroups?.forEach(group => group.finalize());
      this.clients = new Set;
      this.filterGroups = new Map;
    }
    if (cache) this.manager.cache().clear();
    if (catalog) this.catalog.clear();
  }

  databaseConnector(db) {
    return this.manager.connector(db);
  }

  // -- Query Management ----

  cancel(requests) {
    this.manager.cancel(requests);
  }

  exec(query, { priority = Priority.Normal } = {}) {
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
    this.filterGroups.get(client.filterBy)?.reset();
    return query
      ? this.updateClient(client, query)
      : client.update();
  }

  /**
   * Connect a client to the coordinator.
   *
   * @param {import('./MosaicClient.js').MosaicClient} client the client to disconnect
   */
  async connect(client) {
    const { catalog, clients, filterGroups, indexes } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.add(client); // mark as connected

    // retrieve field statistics
    const fields = client.fields();
    if (fields?.length) {
      client.fieldInfo(await catalog.queryFields(fields));
    }

    // connect filters
    const filter = client.filterBy;
    if (filter) {
      if (filterGroups.has(filter)) {
        filterGroups.get(filter).add(client);
      } else {
        const group = new FilterGroup(this, filter, indexes);
        filterGroups.set(filter, group.add(client));
      }
    }

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
    filterGroups.get(client.filterBy)?.remove(client);
  }
}
