import { Query, count, max, min, isNull } from '../sql/index.js';
import { jsType } from './util/js-type.js';
import { FilterGroup } from './FilterGroup.js';
import { socketClient } from './clients/socket.js';

export class Coordinator {
  constructor(db = socketClient()) {
    this.databaseClient(db);
    this.clear();
    this.cache = {
      tables: Object.create(null),
      stats: Object.create(null),
      clear() {
        this.tables = Object.create(null);
        this.stats = Object.create(null);
      }
    };
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

  async tableInfo(table) {
    const cache = this.cache.tables;
    if (cache[table]) {
      return cache[table];
    }

    const q = this.query(
      `PRAGMA table_info('${table}')`,
      { type: 'json' }
    );

    return (cache[table] = q.then(result => {
      const columns = Object.create(null);
      for (const entry of result) {
        columns[entry.name] = { ...entry, jstype: jsType(entry.type) };
      }
      return columns;
    }));
  }

  async stats(table, column) {
    const cache = this.cache.stats;
    const key = `${table}::${column}`;
    if (cache[key]) {
      return cache[key];
    }

    const info = await this.tableInfo(table);
    const colInfo = info[column];

    // column does not exist
    if (colInfo == null) return;

    const q = this.query(
      Query.from(table).select({
        rows: count(),
        nulls: count().where(isNull(column)),
        values: count(column).distinct(),
        min: min(column),
        max: max(column)
      })
    );

    return (cache[key] = q.then(result => {
      const stats = result[Symbol.iterator]().next().value;
      return { table, column, type: colInfo.jstype, ...stats };
    }));
  }

  async connect(client) {
    const { clients, filterGroups } = this;

    if (clients.has(client)) {
      throw new Error('Client already connected.');
    }
    clients.set(client, null); // mark as connected

    // retrieve field statistics
    const fields = await this.resolveColumns(client.fields());
    const stats = await Promise.all(
      fields.map(f => this.stats(f.table, f.column))
    );
    client.stats(stats.filter(x => x));

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

  async resolveColumns(list) {
    if (list.length === 1 && list[0].column === '*') {
      const table = list[0].table;
      const info = await this.tableInfo(table);
      return Object.keys(info).map(column => ({ table, column }));
    } else {
      return list;
    }
  }
}
