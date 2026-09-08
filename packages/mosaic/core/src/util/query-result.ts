/**
 * A query result Promise that allows external callers
 * to resolve or reject the Promise.
 */
export class QueryResult<T = unknown> extends Promise<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;

  constructor() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: unknown) => void;
    super((r, e) => {
      resolve = r;
      reject = e;
    });
    this._resolve = resolve!;
    this._reject = reject!;
  }

  /**
   * Resolve the result Promise with the provided value.
   * @param value The result value.
   * @returns This QueryResult instance.
   */
  fulfill(value: T): this {
    this._resolve(value);
    return this;
  }

  /**
   * Reject the result Promise with the provided error.
   * @param error The error value.
   * @returns This QueryResult instance.
   */
  reject(error: unknown): this {
    this._reject(error);
    return this;
  }
}

// necessary to make Promise subclass act like a Promise
QueryResult.prototype.constructor = Promise;
