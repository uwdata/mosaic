import { DataCubeIndexer } from './DataCubeIndexer.js';

export class FilterGroup {
  /**
   * @param {import('./Coordinator.js').Coordinator} coordinator The Mosaic coordinator.
   * @param {*} selection The shared filter selection.
   * @param {*} index Boolean flag or options hash for data cube indexer.
   *  Falsy values disable indexing.
   */
  constructor(coordinator, selection, index = true) {
    /** @type import('./Coordinator.js').Coordinator */
    this.mc = coordinator;
    this.selection = selection;
    this.clients = new Set();
    this.indexer = index
      ? new DataCubeIndexer(this.mc, { ...index, selection })
      : null;

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

  /**
   * Internal method to process a selection update.
   * The return value is passed as a selection callback value.
   * @returns {Promise} A Promise that resolves when the update completes.
   */
  update() {
    const { mc, indexer, clients, selection } = this;
    const hasIndex = indexer?.index(clients);
    return hasIndex
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
