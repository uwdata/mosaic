export class MosaicClient {
  constructor(filterSelection) {
    this._filterBy = filterSelection;
  }

  get filterBy() {
    return this._filterBy;
  }

  get filterIndexable() {
    return true;
  }

  fields() {
    return null;
  }

  fieldStats() {
    return this;
  }

  query() {
    return null;
  }

  queryPending() {
    return this;
  }

  queryResult() {
    return this;
  }

  queryError(error) {
    console.error(error);
    return this;
  }

  update() {
    return this;
  }
}
