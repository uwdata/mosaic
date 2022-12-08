import { throttle } from './util/throttle.js';

export class FilterGroup {
  constructor(mc, clients = []) {
    this.mc = mc;
    this.clients = new Set(clients);
    this.selections = new Map;
    this.resolve = 'crosssect'; //'intersect';
  }

  filter(client) {
    this.clients.add(client);
    return this;
  }

  where(selection) {
    if (!this.selections.has(selection)) {
      this.selections.set(selection, null); // default: no filter
      const callback = throttle(value => {
        this.selections.set(selection, value);
        return this.update();
      });
      selection.addListener(callback);
    }
    return this;
  }

  async update() {
    const { mc, resolve, selections, clients } = this;
    let queries = [];

    if (resolve === 'intersect') {
      // OPT: filter table once, then reuse for clients?
      const where = buildFilter(selections);
      if (where.length) {
        clients.forEach(client => {
          queries.push([
            client,
            Object.assign(client.query(), { where })
          ]);
        });
      }
    } else if (resolve === 'crosssect') {
      clients.forEach(client => {
        const where = buildFilter(selections, client);
        if (where.length) {
          queries.push([
            client,
            Object.assign(client.query(), { where })
          ]);
        }
      });
    } else if (resolve === 'union') {
      // TODO
      return;
    }

    await Promise.all(
      queries.map(async ([client, query]) => {
        client.data(await mc.query(query)).update();
      })
    );
  }
}

function buildFilter(selections, client) {
  const q = [];
  selections.forEach(sel => {
    for (const entry of sel) {
      const { source, field, type, value } = entry;
      if (source !== client) {
        q.push({ field, type, value });
      }
    }
  });
  return q;
}

// FALCON
// TODO: check if Falcon is applicable
//  - count aggregation
// add listeners for mouse enter / leave / etc to prefetch
// determine active client
// query to build tiles for active client
// convert tiles to summed area maps
// service queries against tiles
