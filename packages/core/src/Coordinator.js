import { socketConnector } from './connectors/socket.js';
import { Catalog } from './Catalog.js';
import { FilterGroup } from './FilterGroup.js';
import { QueryManager, Priority } from './QueryManager.js';
import { voidLogger } from './util/void-logger.js';

let _instance;

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
    this._recorders = [];
  }

  logger(logger) {
    if (arguments.length) {
      this._logger = logger || voidLogger();
      this.manager.logger(this._logger);
    }
    return this._logger;
  }

  configure({ cache = true, indexes = true }) {
    this.manager.cache(cache);
    this.indexes = indexes;
  }

  clear({ clients = true, cache = true, catalog = false } = {}) {
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
    if (arguments.length > 0) {
      this.manager.connector(db);
    }
    return this.manager.connector();
  }

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

  createBundle(name, queries, priority = Priority.Low) {
    return this.manager.request({ type: 'create-bundle', name, queries }, priority);
  }

  loadBundle(name, priority = Priority.High) {
    return this.manager.request({ type: 'load-bundle', name }, priority);
  }

  async updateClient(client, query) {
    try {
      client.queryPending();
      let result;
      try {
        result = await this.query(query);
      } catch (queryError) {
        client.queryError(queryError);
        this._logger.error(queryError);
        return;
      }
      client.queryResult(result).update();
    } catch (clientError) {
      this._logger.error(clientError);
    }
  }

  async requestQuery(client, query) {
    this.filterGroups.get(client.filterBy)?.reset();
    return query
      ? this.updateClient(client, query)
      : client.update();
  }

  async connect(client) {
    const { catalog, clients, filterGroups, indexes } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.add(client); // mark as connected

    // retrieve field statistics
    const fields = client.fields();
    if (fields?.length) {
      client.fieldStats(await catalog.queryFields(fields));
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

  disconnect(client) {
    const { clients, filterGroups } = this;
    if (!clients.has(client)) return;
    clients.delete(client);
    filterGroups.get(client.filterBy)?.remove(client);
  }
}
