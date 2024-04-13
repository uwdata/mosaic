import { MosaicClient } from '../../src/index.js';

export class TestClient extends MosaicClient {
  constructor(query, filterBy, callbacks = {}) {
    super(filterBy);
    this._query = query;
    Object.assign(this, callbacks);
  }
  query(filter = []) {
    return this._query.clone().where(filter);
  }
}
