import { throttle } from './util/throttle.js';

/**
 * Base class for Mosaic clients.
 */
export class MosaicClient {
  /**
   * Constructor.
   * @param {*} filterSelection An optional selection to interactively filter
   *  this client's data. If provided, a coordinator will re-query and update
   *  the client when the selection updates.
   */
  constructor(filterSelection) {
    this._filterBy = filterSelection;
    this._requestUpdate = throttle(() => this.requestQuery(), true);
    this._coordinator = null;
  }

  /**
   * Return this client's connected coordinator.
   */
  get coordinator() {
    return this._coordinator;
  }

  /**
   * Set this client's connected coordinator.
   */
  set coordinator(coordinator) {
    this._coordinator = coordinator;
  }

  /**
   * Return this client's filter selection.
   */
  get filterBy() {
    return this._filterBy;
  }

  /**
   * Return a boolean indicating if the client query can be indexed. Should
   * return true if changes to the filterBy selection does not change the
   * groupby domain of the client query.
   */
  get filterIndexable() {
    return true;
  }

  /**
   * Return an array of fields queried by this client.
   * @returns {object[]|null} The fields to retrieve info for.
   */
  fields() {
    return null;
  }

  /**
   * Called by the coordinator to set the field info for this client.
   * @param {*} info The field info result.
   * @returns {this}
   */
  fieldInfo(info) { // eslint-disable-line no-unused-vars
    return this;
  }

  /**
   * Return a query specifying the data needed by this client.
   * @param {*} [filter] The filtering criteria to apply in the query.
   * @returns {*} The client query
   */
  query(filter) { // eslint-disable-line no-unused-vars
    return null;
  }

  /**
   * Called by the coordinator to inform the client that a query is pending.
   * @returns {this}
   */
  queryPending() {
    return this;
  }

  /**
   * Called by the coordinator to return a query result.
   * @param {*} data The query result.
   * @returns {this}
   */
  queryResult(data) { // eslint-disable-line no-unused-vars
    return this;
  }

  /**
   * Called by the coordinator to report a query execution error.
   * @param {*} error
   * @returns {this}
   */
  queryError(error) {
    console.error(error);
    return this;
  }

  /**
   * Request the coordinator to execute a query for this client.
   * If an explicit query is not provided, the client query method will
   * be called, filtered by the current filterBy selection.
   */
  requestQuery(query) {
    const q = query || this.query(this.filterBy?.predicate(this));
    return this._coordinator.requestQuery(this, q);
  }

  /**
   * Request that the coordinator perform a throttled update of this client
   * using the default query. Unlike requestQuery, for which every call will
   * result in an executed query, multiple calls to requestUpdate may be
   * consolidated into a single update.
   */
  requestUpdate() {
    this._requestUpdate();
  }

  /**
   * Requests a client update.
   * For example to (re-)render an interface component.
   * 
   * @returns {this | Promise<any>}
   */
  update() {
    return this;
  }
}
