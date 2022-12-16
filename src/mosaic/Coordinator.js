import { tableFromIPC } from 'apache-arrow';
import { jsType } from './util/js-type.js';
import { FilterGroup } from './FilterGroup.js';
import * as Format from './formats.js';

export class Coordinator {
  constructor(uri = 'http://localhost:3000/') {
    this.clients = [];
    this.uri = uri;
    this.cache = {
      tables: Object.create(null),
      stats: Object.create(null)
    };
    this.filterGroups = new Map;
  }

  async query(query) {
    const t0 = Date.now();
    const pending = fetch(this.uri, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    const { format = Format.Arrow } = query;
    const table = await (format === Format.Arrow
      ? tableFromIPC(pending)
      : (await pending).json());

    console.log(`Query time: ${Date.now()-t0}`);
    return table;
  }

  async tableInfo(table) {
    const cache = this.cache.tables;
    if (cache[table]) {
      return cache[table];
    }

    const q = this.query({
      format: Format.JSON,
      sql: `PRAGMA table_info('${table}')`
    });

    return (cache[table] = q.then(result => {
      const columns = Object.create(null);
      for (const entry of result) {
        columns[entry.name] = Object.assign(entry, { jstype: jsType(entry.type) });
      }
      return columns;
    }));
  }

  async stats(table, field) {
    const cache = this.cache.stats;
    const key = `${table}::${field}`;
    if (cache[key]) {
      return cache[key];
    }

    const q = this.query({
      from: [table],
      select: {
        rows: { aggregate: 'count' },
        nulls: { aggregate: 'count', filter: `${field} IS NULL` },
        values: { aggregate: 'count', distinct: true, field },
        min: { aggregate: 'min', field },
        max: { aggregate: 'max', field }
      }
    });

    const info = await this.tableInfo(table);

    return (cache[key] = q.then(result => {
      const stats = Array.from(result)[0];
      return { table, field, type: info[field].jstype, ...stats };
    }));
  }

  async connect(client) {
    if (this.clients.find(x => x.client === client)) {
      throw new Error('Client already connected.');
      // or no-op?
    }
    this.clients.push(client);

    // retrieve field statistics
    const fields = await this.resolveFields(client.fields());
    const stats = await Promise.all(
      fields.map(f => this.stats(f.table, f.field))
    );
    client.stats(stats);

    // connect filters
    const filter = client.filter?.();
    let group;
    if (filter) {
      const groups = this.filterGroups;
      if (!groups.has(filter)) {
        groups.set(filter, new FilterGroup(this));
      }
      group = groups.get(filter);
      group.filter(client).where(filter);
    }

    // query handler
    const handle = async q => {
      q = group ? group.query(client, q) : q;
      const data = await this.query(q);
      client.data(data).update();
    };

    // register request handler, if defined
    if (client.request) {
      client.request.addListener(handle);
    }

    // TODO analyze / consolidate queries?
    const q = client.query?.();
    if (q) handle(q);
  }

  async resolveFields(list) {
    if (list.length === 1 && list[0].field === '*') {
      const table = list[0].table;
      const info = await this.tableInfo(table);
      return Object.keys(info).map(field => ({ table, field }));
    } else {
      return list;
    }
  }
}