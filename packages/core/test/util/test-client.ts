import { MosaicClient } from '../../src/index.js';
import type { Query } from '@uwdata/mosaic-sql';

export class TestClient extends MosaicClient {
  private _query: Query;

  constructor(query: Query, filterBy?: any, callbacks: Record<string, any> = {}) {
    super(filterBy);
    this._query = query;
    Object.assign(this, callbacks);
  }

  query(filter: any[] = []): Query {
    return this._query.clone().where(filter);
  }
}