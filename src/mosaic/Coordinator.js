import { Catalog } from './Catalog.js';
import { FilterGroup } from './FilterGroup.js';
import { socketClient } from './clients/socket.js';

export class Coordinator {
  constructor(db = socketClient()) {
    this.catalog = new Catalog(this);
    this.databaseClient(db);
    this.clear();
  }

  clear() {
    this.clients?.forEach((_, client) => this.disconnect(client));
    this.clients = new Map;
    this.filterGroups = new Map;
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

  async query(query, options = {}) {
    const t0 = Date.now();
    const { type = 'arrow' } = options;
    const table = await this.db.query({ type, sql: String(query) });
    console.log(`Query time: ${Date.now()-t0}`);
    return table;
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
    client.fieldStats(await catalog.queryFields(client.fields()));

    // connect filters
    const filter = client.filterBy;
    if (filter) {
      if (!filterGroups.has(filter)) {
        filterGroups.set(filter, new FilterGroup(this, filter));
      }
      filterGroups.get(filter).add(client);
    }

    // query handler
    const handler = async () => {
      const q = client.query(filter?.predicate(client));
      if (q) this.updateClient(client, q);
    };
    clients.set(client, handler);

    // register request handler, if defined
    client.request?.addListener('value', handler);

    // TODO analyze / consolidate queries?
    handler();
  }

  disconnect(client) {
    const { clients, filterGroups } = this;
    if (!clients.has(client)) return;
    const handler = clients.get(client);
    clients.delete(client);
    filterGroups.get(client.filterBy)?.remove(client);
    client.request?.removeListener(handler);
  }
}
