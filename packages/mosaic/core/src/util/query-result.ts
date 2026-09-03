export const QueryState = Object.freeze({
  pending: Symbol('pending'),
  error: Symbol('error'),
  done: Symbol('done')
});

type QueryStateType = typeof QueryState[keyof typeof QueryState];

/**
 * A query result Promise that can allows external callers
 * to resolve or reject the Promise.
 */
export class QueryResult<T = unknown> extends Promise<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;
  private _state: QueryStateType;

  /**
   * Create a new query result Promise.
   */
  constructor() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: unknown) => void;
    super((r, e) => {
      resolve = r;
      reject = e;
    });
    this._resolve = resolve!;
    this._reject = reject!;
    this._state = QueryState.pending;
  }

  /**
   * Resolve the result Promise with the provided value.
   * @param value The result value.
   * @returns This QueryResult instance.
   */
  fulfill(value: T): this {
    this._state = QueryState.done;
    this._resolve(value);
    return this;
  }

  /**
   * Rejects the result Promise with the provided error.
   * @param error The error value.
   * @returns This QueryResult instance.
   */
  reject(error: unknown): this {
    this._state = QueryState.error;
    this._reject(error);
    return this;
  }

  /**
   * Returns the state of this query result.
   * @returns The current state symbol.
   */
  get state(): QueryStateType {
    return this._state;
  }
}

// necessary to make Promise subclass act like a Promise
QueryResult.prototype.constructor = Promise;