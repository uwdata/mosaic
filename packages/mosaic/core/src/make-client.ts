import type { Coordinator } from './Coordinator.js';
import type { Selection } from './Selection.js';
import type { FilterExpr } from '@uwdata/mosaic-sql';
import { type ClientQuery, MosaicClient } from './MosaicClient.js';
import { coordinator as defaultCoordinator } from './Coordinator.js';

export interface MakeClientOptions {
  /** Mosaic coordinator. Defaults to the global coordinator. */
  coordinator?: Coordinator;
  /** A selection whose predicates are fed into the query function to produce the SQL query. */
  selection?: Selection;
  /** A flag (default `true`) indicating if the client should initially be enabled or not. */
  enabled?: boolean;
  /** A flag (default `true`) indicating if client queries can be sped up using pre-aggregated data.
   * Should be set to `false` if filtering changes the groupby domain of the query. */
  filterStable?: boolean;
  /** An async function to prepare the client before running queries. */
  prepare?: () => Promise<void>;
  /** A function that returns a query from a list of selection predicates. */
  query?: (filter: FilterExpr) => ClientQuery;
  /** Called by the coordinator to return a query result. */
  queryResult?: (data: unknown) => void;
  /** Called by the coordinator to inform the client that a query is pending. */
  queryPending?: () => void;
  /** Called by the coordinator to report a query execution error. */
  queryError?: (error: Error) => void;
}

/**
 * Make a new client with the given options, and connect the client to the
 * provided coordinator.
 * @param options The options for making the client.
 * @returns The resulting client.
 */
export function makeClient(options: MakeClientOptions): MosaicClient {
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
  private readonly _methods: Omit<MakeClientOptions, 'coordinator' | 'selection' | 'enabled' | 'filterStable'>;
  private readonly _filterStable: boolean;

  /**
   * @param options The options for making the client.
   */
  constructor({
    selection = undefined,
    enabled = true,
    filterStable = true,
    ...methods
  }: Omit<MakeClientOptions, 'coordinator'>) {
    super(selection);
    this.enabled = enabled;
    this._methods = methods;
    this._filterStable = filterStable;
  }

  get filterStable(): boolean {
    return this._filterStable;
  }

  async prepare(): Promise<void> {
    await this._methods.prepare?.();
  }

  query(filter: FilterExpr): ClientQuery {
    return this._methods.query?.(filter) ?? null;
  }

  queryResult(data: unknown): this {
    this._methods.queryResult?.(data);
    return this;
  }

  queryPending(): this {
    this._methods.queryPending?.();
    return this;
  }

  queryError(error: Error): this {
    this._methods.queryError?.(error);
    return this;
  }
}