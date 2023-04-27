import { socketConnector } from './connectors/socket.js';
import { Catalog } from './Catalog.js';
import { FilterGroup } from './FilterGroup.js';
import { QueryCache, voidCache } from './QueryCache.js';
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
    this.logger(options.logger || console);
    this.configure(options);
    this.databaseConnector(db);
    this.clear();
    this._recorders = [];
  }

  logger(logger) {
    return arguments.length
      ? (this._logger = logger || voidLogger())
      : this._logger;
  }

  configure({ cache = true, indexes = true }) {
    this.cache = cache ? new QueryCache() : voidCache();
    this.indexes = indexes;
  }

  clear({ clients = true, cache = true, catalog = false } = {}) {
    if (clients) {
      this.clients?.forEach(client => this.disconnect(client));
      this.filterGroups?.forEach(group => group.finalize());
      this.clients = new Set;
      this.filterGroups = new Map;
    }
    if (cache) this.cache.clear();
    if (catalog) this.catalog.clear();
  }

  databaseConnector(db) {
    if (arguments.length > 0) {
      this.db = db;
    }
    return this.db;
  }

  async exec(sql) {
    try {
      updateRecorders(this._recorders, sql);
      await this.db.query({ type: 'exec', sql });
    } catch (err) {
      this._logger.error(err);
    }
  }

  query(query, {
    type = 'arrow',
    cache = true,
    persist = false
  } = {}) {
    const sql = String(query);
    updateRecorders(this._recorders, sql);
    const t0 = performance.now();
    const cached = this.cache.get(sql);
    if (cached) {
      this._logger.debug('Cache');
      return cached;
    } else {
      const request = this.db.query({ type, sql, persist });
      const result = cache ? this.cache.set(sql, request) : request;
      result.then(() => this._logger.debug(`Query: ${(performance.now() - t0).toFixed(1)}`));
      return result;
    }
  }

  async createBundle(name, queries) {
    try {
      await this.db.query({ type: 'create-bundle', name, queries });
    } catch (err) {
      this._logger.error(err);
    }
  }

  async loadBundle(name) {
    try {
      await this.db.query({ type: 'load-bundle', name });
    } catch (err) {
      this._logger.error(err);
    }
  }

  async updateClient(client, query) {
    let result;
    try {
      client.queryPending();
      result = await this.query(query);
    } catch (err) {
      this._logger.error(err);
      client.queryError(err);
      return;
    }
    try {
      return client.queryResult(result).update();
    } catch (err) {
      this._logger.error(err);
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

  record() {
    let state = [];
    const mc = this;
    const recorder = {
      add(query) { state.push(query); },
      reset() { state = []; },
      snapshot() { return state.slice(); },
      stop() {
        mc._recorders = mc._recorders.filter(x => x !== this);
        return state;
      }
    };
    this._recorders.push(recorder);
    return recorder;
  }
}

function updateRecorders(recorders, sql) {
  if (recorders.length && sql) {
    recorders.forEach(rec => rec.add(sql));
  }
}
