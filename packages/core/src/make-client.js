import { MosaicClient } from "./MosaicClient.js";
import {
  coordinator as defaultCoordinator,
} from "./Coordinator.js";

/**
 * @typedef {Object} MakeClientOptions
 * @property {import('./Coordinator.js').Coordinator} [coordinator] - Mosaic coordinator. Default to the global coordinator.
 * @property {import('./Selection.js').Selection|null} [selection] - A selection whose predicates will be fed into the query function to produce the SQL query.
 * @property {function(): Promise<void>} [prepare] - An async function to prepare the client before running queries.
 * @property {function(any): any} query - A function that returns a query from a list of selection predicates.
 * @property {function(any): void} [queryResult] - Called by the coordinator to return a query result.
 * @property {function(): void} [queryPending] - Called by the coordinator to report a query execution error.
 * @property {function(any): void} [queryError] - Called by the coordinator to inform the client that a query is pending.
 */

/** Make a new client with the given options, and connect the client to the provided coordinator.
 * @param {MakeClientOptions} options - The options for making the client
 * @returns {MosaicClient & { destroy: () => void }} - The result object with methods to request an update or destroy the client.
 */
export function makeClient(options) {
  const coordinator = options.coordinator ?? defaultCoordinator();
  const client = new ProxyClient({ ...options, coordinator });
  coordinator.connect(client);
  return client;
}

/** An internal class used to implement the makeClient API */
class ProxyClient extends MosaicClient {
  /** @param {MakeClientOptions} options */
  constructor(options) {
    super(options.selection);

    /** @type {MakeClientOptions} */
    this._options = { ...options };
  }

  async prepare() {
    await this._options.prepare?.();
  }

  query(filter) {
    return this._options.query(filter);
  }

  queryResult(data) {
    this._options.queryResult?.(data);
    return this;
  }

  queryPending() {
    this._options.queryPending?.();
    return this;
  }

  queryError(error) {
    this._options.queryError?.(error);
    return this;
  }

  destroy() {
    this._options.coordinator.disconnect(this);
  }
}
