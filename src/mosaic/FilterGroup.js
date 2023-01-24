import { DataTileIndexer } from './DataTileIndexer.js';
import { throttle } from './util/throttle.js';

export class FilterGroup {
  constructor(mc, selection, clients = []) {
    this.mc = mc;
    this.selection = selection;
    this.clients = new Set(clients);
    this.indexer = new DataTileIndexer(mc, selection);

    selection.addListener('value', throttle(() => this.update()));
    selection.addListener('activate', clause => {
      this.indexer?.index(this.clients, clause);
    });
  }

  reset() {
    this.indexer?.reset();
  }

  add(client) {
    (this.clients = new Set(this.clients)).add(client);
    return this;
  }

  remove(client) {
    if (this.clients.has(client)) {
      (this.clients = new Set(this.clients)).delete(client);
    }
    return this;
  }

  async update() {
    const { mc, indexer, clients, selection } = this;
    return indexer?.index(clients)
      ? indexer.update()
      : defaultUpdate(mc, clients, selection);
  }
}

function defaultUpdate(mc, clients, selection) {
  return Promise.all(Array.from(clients).map(client => {
    const filter = selection.predicate(client);
    if (filter != null) {
      return mc.updateClient(client, client.query(filter));
    }
  }));
}
