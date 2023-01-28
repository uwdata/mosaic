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
    this.databaseClient(db);
    this.clear();
  }

  clear({ cache = true, catalog = false } = {}) {
    this.clients?.forEach((_, client) => this.disconnect(client));
    this.clients = new Map;
    this.filterGroups = new Map;
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

  async connect(client) {
    const { catalog, clients, filterGroups } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.set(client, null); // mark as connected

    // retrieve field statistics
    const fields = client.fields();
    if (fields?.length) {
      client.fieldStats(await catalog.queryFields(fields));
    }

    // connect filters
    const filter = client.filterBy;
    if (filter) {
      if (!filterGroups.has(filter)) {
        filterGroups.set(filter, new FilterGroup(this, filter));
      }
      filterGroups.get(filter).add(client);
    }

    // query handler
    const handler = async (query) => {
      const q = query || client.query(filter?.predicate(client));
      filterGroups.get(filter)?.reset();
      if (q) this.updateClient(client, q);
    };
    clients.set(client, handler);

    // register request handler, if defined
    client.request?.addEventListener('value', handler);

    // TODO analyze / consolidate queries?
    handler();
  }

  disconnect(client) {
    const { clients, filterGroups } = this;
    if (!clients.has(client)) return;
    const handler = clients.get(client);
    clients.delete(client);
    filterGroups.get(client.filterBy)?.remove(client);
    client.request?.removeEventListener(handler);
  }
}
