import { MosaicClient, Selection } from '../../src/index.js';
import type { FilterExpr, SelectQuery } from '@uwdata/mosaic-sql';

export class TestClient extends MosaicClient {
  private _query: SelectQuery | null;

  constructor(
    query: SelectQuery | null,
    filterBy?: Selection,
    callbacks: Record<string, unknown> = {}
  ) {
    super(filterBy);
    this._query = query;
    Object.assign(this, callbacks);
  }

  query(filter: FilterExpr = []): SelectQuery | null {
    return this._query?.clone().where(filter) || null;
  }
}