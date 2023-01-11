import { DataTileIndexer } from './DataTileIndexer.js';
import { throttle } from './util/throttle.js';

export class FilterGroup {
  constructor(mc, selection, clients = []) {
    this.mc = mc;
    this.selection = selection;
    this.clients = new Set(clients);
    this.indexer = new DataTileIndexer(mc, selection);

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
    const { mc, indexer, clients, selection } = this;
    return indexer?.index(clients)
      ? indexer.update()
      : defaultUpdate(mc, clients, selection);
  }
}

function defaultUpdate(mc, clients, selection) {
  return Promise.all(Array.from(clients).map(async client => {
    const where = selection.predicate(client);
    if (where != null) {
      client.data(await mc.query(client.query(where))).update();
    }
  }));
}
