import { tableFromIPC } from 'apache-arrow';
import { FilterGroup } from './FilterGroup.js';
import * as Format from './formats.js';

export class Coordinator {
  constructor(uri = 'http://localhost:3000/') {
    this.clients = [];
    this.uri = uri;
    this.cache = {};
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

  async stats(table, field) {
    const { cache } = this;
    const statsCache = cache.stats || (cache.stats = {});
    const key = `${table}::${field}`;
    if (statsCache[key]) {
      return statsCache[key];
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

    return (statsCache[key] = q.then(result => {
      const stats = Array.from(result)[0];
      return { table, field, ...stats };
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

    // register request handler, if defined
    if (client.request) {
      client.request.addListener(async q => {
        q = group ? group.query(client, q) : q;
        const data = await this.query(q);
        client.data(data, true).update();
      });
    }

    // TODO analyze / consolidate queries?
    const q = client.query?.();
    if (q) {
      const data = await this.query(q);
      client.data(data).update();
    }
  }

  async resolveFields(list) {
    if (list.length === 1 && list[0].field === '*') {
      const table = list[0].table;
      const cols = await this.query({
        format: Format.JSON,
        pragma: `table_info('${table}')`
      });
      return cols.map(c => ({ table, field: c.name }));
    } else {
      return list;
    }
  }
}