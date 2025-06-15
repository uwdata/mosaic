import { MosaicClient } from '../../src/index.js';
import type { Query, SelectQuery } from '@uwdata/mosaic-sql';

export class TestClient extends MosaicClient {
  private _query: SelectQuery | null;

  constructor(query: SelectQuery | null, filterBy?: any, callbacks: Record<string, any> = {}) {
    super(filterBy);
    this._query = query;
    Object.assign(this, callbacks);
  }

  query(filter: any[] = []): SelectQuery | null {
    return this._query?.clone().where(filter) || null;
  }
}