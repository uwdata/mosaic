/** @import { Coordinator } from './Coordinator.js' */
/** @import { Selection } from './Selection.js' */
import { MosaicClient } from './MosaicClient.js';
import { coordinator as defaultCoordinator } from './Coordinator.js';

/**
 * @typedef {Object} MakeClientOptions
 * @property {Coordinator} [coordinator] Mosaic coordinator.
 *  Defaults to the global coordinator.
 * @property {Selection|null} [selection] A selection whose predicates are
 *  fed into the query function to produce the SQL query.
 * @property {boolean} [enabled] A flag (default `true`) indicating if the
 *  client should initially be enabled or not.
 * @property {boolean} [filterStable] A flag (default `true`) indicating if the
 *  if client queries can be sped up using pre-aggregated data. Should be set
 *  to `false` if filtering changes the groupby domain of the query.
 * @property {function(): Promise<void>} [prepare]
 *  An async function to prepare the client before running queries.
 * @property {function(any): any} [query]
 *  A function that returns a query from a list of selection predicates.
 * @property {function(any): void} [queryResult]
 *  Called by the coordinator to return a query result.
 * @property {function(): void} [queryPending]
 *  Called by the coordinator to report a query execution error.
 * @property {function(any): void} [queryError]
 *  Called by the coordinator to inform the client that a query is pending.
 */

/**
 * Make a new client with the given options, and connect the client to the
 * provided coordinator.
 * @param {MakeClientOptions} options The options for making the client.
 * @returns {MosaicClient & { destroy: () => void }} The resulting client,
 *  along with a method to destroy the client when no longer needed.
 */
export function makeClient(options) {
  const {
    coordinator = defaultCoordinator(),
    ...clientOptions
  } = options;
  const client = new ProxyClient(clientOptions);
  coordinator.connect(client);
  return client;
}

/**
 * An internal class used to implement the makeClient API.
 */
class ProxyClient extends MosaicClient {
  /**
   * @param {MakeClientOptions} options The options for making the client.
   */
  constructor({
    selection = undefined,
    enabled = true,
    filterStable = true,
    ...methods
  }) {
    super(selection);
    this.enabled = enabled;

    /**
     * @type {MakeClientOptions}
     * @readonly
     */
    this._methods = methods;

    /**
     * @type {boolean}
     * @readonly
     */
    this._filterStable = filterStable;
  }

  get filterStable() {
    return this._filterStable;
  }

  async prepare() {
    await this._methods.prepare?.();
  }

  query(filter) {
    return this._methods.query?.(filter) ?? null;
  }

  queryResult(data) {
    this._methods.queryResult?.(data);
    return this;
  }

  queryPending() {
    this._methods.queryPending?.();
    return this;
  }

  queryError(error) {
    this._methods.queryError?.(error);
    return this;
  }

  destroy() {
    this.coordinator.disconnect(this);
  }
}
