import { throttle } from './util/throttle.js';

export class FilterGroup {
  constructor(mc, selection, clients = []) {
    this.mc = mc;
    this.selection = selection;
    this.clients = new Set(clients);

    const callback = throttle(() => this.update());
    selection.addListener(callback);
  }

  filter(client) {
    this.clients.add(client);
    return this;
  }

  query(client) {
    return client.query(this.selection.predicate(client));
  }

  async update() {
    const { mc, selection, clients } = this;
    await Promise.all(Array.from(clients).map(async client => {
      const where = selection.predicate(client);
      if (where != null) {
        client.data(await mc.query(client.query(where))).update();
      }
    }));
  }
}

// FALCON
// TODO: check if Falcon is applicable
//  - count aggregation
// add listeners for mouse enter / leave / etc to prefetch
// determine active client
// query to build tiles for active client
// convert tiles to summed area maps
// service queries against tiles
