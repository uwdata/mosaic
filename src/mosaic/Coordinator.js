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

  async connect(client) {
    const { catalog, clients, filterGroups } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.set(client, null); // mark as connected

    // retrieve field statistics
    client.stats(await catalog.queryFields(client.fields()));

    // connect filters
    const filter = client.filter?.();
    let group;
    if (filter) {
      if (!filterGroups.has(filter)) {
        filterGroups.set(filter, new FilterGroup(this, filter));
      }
      group = filterGroups.get(filter).add(client);
    }

    // query handler
    const handler = async q => {
      q = group ? group.query(client) : q;
      try {
        client.data(await this.query(q)).update();
      } catch (err) {
        console.error(err);
      }
    };
    clients.set(client, handler);

    // register request handler, if defined
    client.request?.addListener(handler);

    // TODO analyze / consolidate queries?
    const q = client.query();
    if (q) handler(q);
  }

  disconnect(client) {
    const { clients, filterGroups } = this;
    if (!clients.has(client)) return;
    const handler = clients.get(client);
    clients.delete(client);
    filterGroups.get(client.filter?.())?.remove(client);
    client.request?.removeListener(handler);
  }
}
