import { tableFromIPC } from 'apache-arrow';
import { FilterGroup } from './FilterGroup.js';

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
    // const table = await (await pending).json();
    const table = await tableFromIPC(pending);
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
    const fields = client.fields();
    const stats = await Promise.all(
      fields.map(f => this.stats(f.table, f.field))
    );
    client.stats(stats);

    // connect filters
    const groups = this.filterGroups;
    const filter = client.filter();
    if (filter) {
      if (!groups.has(filter)) {
        groups.set(filter, new FilterGroup(this));
      }
      const group = groups.get(filter);
      group.filter(client).where(filter);
    }

    // TODO analyze / consolidate queries
    // TODO include linked selections...
    const q = client.query();
    if (q) {
      const data = await this.query(q);
      client.data(data).update();
    }
  }
}