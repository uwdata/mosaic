/** @import { Query } from '@uwdata/mosaic-sql' */
/** @import { Coordinator } from './Coordinator.js' */
/** @import { Selection } from './Selection.js' */
import { queryFieldInfo } from './util/field-info.js';
import { throttle } from './util/throttle.js';

/**
 * A Mosaic client is a data consumer that indicates its data needs to a
 * Mosaic coordinator via the query method. The coordinator is responsible
 * for issuing queries and returning results to the client.
 *
 * The client life-cycle consists of connection to a coordinator,
 * initialization (potentially involving queries for data schema and summary
 * statistic information), and then interactive queries that may be driven by
 * an associated selection. When no longer needed, a client should be
 * disconnected from the coordinator.
 *
 * When enabled, a client will initialize and respond to query update requests.
 * If disabled, the client will delay initialization and not respond to queries
 * until enabled again. Disabling a client can improve system performance when
 * associated interface elements are offscreen or disabled.
 */
export class MosaicClient {
  /**
   * Create a new client instance.
   * @param {Selection} [filterSelection] An optional selection to
   *  interactively filter this client's data. If provided, a coordinator
   *  will re-query and update the client when the selection updates.
   */
  constructor(filterSelection) {
    /** @type {Selection} */
    this._filterBy = filterSelection;
    this._requestUpdate = throttle(() => this.requestQuery(), true);
    /** @type {Coordinator} */
    this._coordinator = null;
    /** @type {Promise<any>} */
    this._pending = Promise.resolve();
    /** @type {boolean} */
    this._enabled = true;
    /** @type {boolean} */
    this._initialized = false;
    /** @type {Query | boolean} */
    this._request = null;
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
   * Return this client's enabled state.
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Set this client's enabled state;
   */
  set enabled(state) {
    state = !!state; // ensure boolean
    if (this._enabled !== state) {
      this._enabled = state;
      if (state) {
        if (!this._initialized) {
          // initialization includes a query request
          this.initialize();
        } else if (this._request) {
          // request query now if requested while disabled
          this.requestQuery(this._request === true ? undefined : this._request);
        }
        this._request = null;
      }
    }
  }

  /**
   * Return a Promise that resolves once the client has updated.
   */
  get pending() {
    return this._pending;
  }

  /**
   * Return this client's filter selection.
   */
  get filterBy() {
    return this._filterBy;
  }

  /**
   * Return a boolean indicating if the client query can be sped up with
   * materialized views of pre-aggregated data. Should return true if changes to
   * the filterBy selection does not change the groupby domain of the client
   * query.
   */
  get filterStable() {
    return true;
  }

  /**
   * Return an array of fields queried by this client.
   * @returns {import('./types.js').FieldInfoRequest[] | null}
   *  The fields to retrieve info for.
   */
  fields() {
    return null;
  }

  /**
   * Called by the coordinator to set the field info for this client.
   * @param {import('./types.js').FieldInfo[]} info The field info result.
   * @returns {this}
   */
  fieldInfo(info) { // eslint-disable-line no-unused-vars
    return this;
  }

  /**
   * Prepare the client before the query() method is called.
   */
  async prepare() {
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
  queryError(error) { // eslint-disable-line no-unused-vars
    // do nothing, the coordinator logs the error
    return this;
  }

  /**
   * Request the coordinator to execute a query for this client.
   * If an explicit query is not provided, the client `query` method will
   * be called, filtered by the current `filterBy` selection. This method has
   * no effect if the client is not connected to a coordinator. If the client
   * is connected by currently disabled, the request will be serviced if the
   * client is later enabled.
   * @param {Query} [query] The query to request. If unspecified, the query
   *  will be determind by the client's `query` method and the current
   *  `filterBy` selection state.
   * @returns {Promise}
   */
  requestQuery(query) {
    if (this._enabled) {
      const q = query || this.query(this.filterBy?.predicate(this));
      return this._coordinator?.requestQuery(this, q);
    } else {
      this._request = query ?? true;
      return null;
    }
  }

  /**
   * Request that the coordinator perform a throttled update of this client
   * using the default query. Unlike requestQuery, for which every call results
   * in an executed query, multiple calls to requestUpdate may be consolidated
   * into a single update. This method has no effect if the client is not
   * connected to a coordinator. If the client is connected but currently
   * disabled, the request will be serviced if the client is later enabled.
   */
  requestUpdate() {
    if (this._enabled) {
      this._requestUpdate();
    } else {
      this.requestQuery();
    }
  }

  /**
   * Reset this client, initiating new field info, call the prepare method,
   * and query requests. This method has no effect if the client is not
   * registered with a coordinator.
   * @returns {Promise}
   */
  async initialize() {
    if (!this._enabled) {
      // clear flag so we initialize when enabled again
      this._initialized = false;
    } else if (this._coordinator) {
      // if connected, let's initialize
      this._initialized = true;
      this._pending = initialize(this);
    }
  }

  /**
   * Requests a client update, for example to (re-)render an interface
   * component.
   * @returns {this | Promise<any>}
   */
  update() {
    return this;
  }
}

/**
 * Perform client initialization. This method has been broken out so we can
 * capture the resulting promise and set it as the client's pending promise.
 * @param {MosaicClient} client The Mosaic client to initialize.
 * @returns {Promise} A Promise that resolves when initialization completes.
 */
async function initialize(client) {
  // retrieve field statistics
  const fields = client.fields();
  if (fields?.length) {
    client.fieldInfo(await queryFieldInfo(client.coordinator, fields));
  }
  await client.prepare(); // perform custom preparation
  return client.requestQuery(); // request data query
}
