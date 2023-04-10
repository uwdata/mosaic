import { DataTileIndexer } from './DataTileIndexer.js';

export class FilterGroup {
  constructor(coordinator, selection, index = true) {
    this.mc = coordinator;
    this.selection = selection;
    this.clients = new Set();
    this.indexer = index ? new DataTileIndexer(this.mc, selection) : null;

    const { value, activate } = this.handlers = {
      value: () => this.update(),
      activate: clause => this.indexer?.index(this.clients, clause)
    };
    selection.addEventListener('value', value);
    selection.addEventListener('activate', activate);
  }

  finalize() {
    const { value, activate } = this.handlers;
    this.selection.removeEventListener('value', value);
    this.selection.removeEventListener('activate', activate);
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

  update() {
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
