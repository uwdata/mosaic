import { FilterExpr, type Query } from '@uwdata/mosaic-sql';
import { type Coordinator } from './Coordinator.js';
import { type Selection } from './Selection.js';
import { throttle } from './util/throttle.js';

export type ClientQuery = Query | string | null;

export function isMosaicClient(x: unknown): x is MosaicClient {
  return x instanceof MosaicClient;
}

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
  _filterBy: Selection | undefined;
  _requestUpdate: () => void;
  _coordinator: Coordinator | null;
  _pending: Promise<unknown>;
  _enabled: boolean;
  _initialized: boolean;
  _request: Query | boolean | null;

  /**
   * Create a new client instance.
   * @param filterSelection An optional selection to
   *  interactively filter this client's data. If provided, a coordinator
   *  will re-query and update the client when the selection updates.
   */
  constructor(filterSelection?: Selection) {
    this._filterBy = filterSelection;
    this._requestUpdate = throttle(() => this.requestQuery(), true);
    this._coordinator = null;
    this._pending = Promise.resolve();
    this._enabled = true;
    this._initialized = false;
    this._request = null;
  }

  /**
   * @returns this client's connected coordinator.
   */
  get coordinator(): Coordinator | null {
    return this._coordinator;
  }

  /**
   * Set this client's connected coordinator.
   */
  set coordinator(coordinator: Coordinator | null) {
    this._coordinator = coordinator;
  }

  /**
   * Return this client's enabled state.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Set this client's enabled state;
   */
  set enabled(state: boolean) {
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
  get pending(): Promise<unknown> {
    return this._pending;
  }

  /**
   * @returns this client's filter selection.
   */
  get filterBy(): Selection | undefined {
    return this._filterBy;
  }

  /**
   * Return a boolean indicating if the client query can be sped up with
   * materialized views of pre-aggregated data. Should return true if changes
   * to the filterBy selection do not change the groupby domain of the client
   * query.
   */
  get filterStable(): boolean {
    return true;
  }

  /**
   * Prepare the client before the `query()` method is called. Subclasses
   * should override this method as needed, potentially issuing one or more
   * queries to gather data or metadata needed prior to `query` calls.
   */
  async prepare(): Promise<void> {
  }

  /**
   * Return a query specifying the data needed by this client.
   * @param filter The filtering criteria to apply in the query.
   * @returns The client query
   */
  query(filter?: FilterExpr | null): ClientQuery { // eslint-disable-line @typescript-eslint/no-unused-vars
    return null;
  }

  /**
   * Called by the coordinator to inform the client that a query is pending.
   * @returns this
   */
  queryPending(): this {
    return this;
  }

  /**
   * Called by the coordinator to return a query result.
   * @param data The query result.
   * @returns this
   */
  queryResult(data: unknown): this { // eslint-disable-line @typescript-eslint/no-unused-vars
    return this;
  }

  /**
   * Called by the coordinator to report a query execution error.
   * @param error
   * @returns this
   */
  queryError(error: Error): this { // eslint-disable-line @typescript-eslint/no-unused-vars
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
   * @param query The query to request. If unspecified, the query
   *  will be determined by the client's `query` method and the current
   *  `filterBy` selection state.
   */
  requestQuery(query?: Query): Promise<unknown> | null {
    if (this._enabled) {
      const q = query || this.query(this.filterBy?.predicate(this));
      return this._coordinator!.requestQuery(this, q);
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
  requestUpdate(): void {
    if (this._enabled) {
      this._requestUpdate();
    } else {
      this.requestQuery();
    }
  }

  /**
   * Reset this client, calling the prepare method and query requests. This
   * method has no effect if the client is not registered with a coordinator.
   */
  initialize(): void {
    if (!this._enabled) {
      // clear flag so we initialize when enabled again
      this._initialized = false;
    } else if (this._coordinator) {
      // if connected, let's initialize
      this._initialized = true;
      this._pending = this.prepare().then(() => this.requestQuery());
    }
  }

  /**
   * Remove this client: disconnect from the coordinator and free up any
   * resource use. This method has no effect if the client is not connected
   * to a coordinator.
   *
   * If overriding this method in a client subclass, be sure to also
   * disconnect from the coordinator.
   */
  destroy(): void {
    this._enabled = false;
    this.coordinator?.disconnect(this);
  }

  /**
   * Requests a client update, for example to (re-)render an interface
   * component.
   */
  update(): this | Promise<unknown> {
    return this;
  }
}