import { socketClient } from './clients/socket.js';
import { Catalog } from './Catalog.js';
import { FilterGroup } from './FilterGroup.js';
import { QueryCache } from './QueryCache.js';

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
  constructor(db = socketClient()) {
    this.cache = new QueryCache();
    this.catalog = new Catalog(this);
    this.indexes = true;
    this.databaseClient(db);
    this.clear();
  }

  configure({ cache = true, indexes = true }) {
    this.cache = cache ? new QueryCache() : {
      get: () => undefined,
      set: (key, result) => result,
      clear: () => {}
    };
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

  databaseClient(db) {
    if (arguments.length > 0) {
      this.db = db;
    }
    return this.db;
  }

  async exec(sql) {
    try {
      await this.db.query({ type: 'exec', sql });
    } catch (err) {
      console.error(err);
    }
  }

  async query(query, { type = 'arrow', cache = true } = {}) {
    const sql = String(query);
    const cached = this.cache.get(sql);
    if (cached) {
      return cached;
    } else {
      const request = this.db.query({ type, sql });
      return cache ? this.cache.set(sql, request) : request;
    }
  }

  async updateClient(client, query) {
    let result;
    try {
      client.queryPending();
      result = await this.query(query);
    } catch (err) {
      console.error(err);
      client.queryError(err);
      return;
    }
    try {
      client.queryResult(result).update();
    } catch (err) {
      console.error(err);
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
