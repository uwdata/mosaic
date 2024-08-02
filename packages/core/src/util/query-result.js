/**
 * A query result Promise that can allows external callers
 * to resolve or reject the Promise.
 */
export class QueryResult extends Promise {
  /**
   * Create a new query result Promise.
   */
  constructor() {
    let resolve;
    let reject;
    super((r, e) => {
      resolve = r;
      reject = e;
    });
    this._resolve = resolve;
    this._reject = reject;
    this._pending = true;
  }

  /**
   * Resolve the result Promise with the provided value.
   * @param {*} value The result value.
   * @returns {this}
   */
  fulfill(value) {
    this._pending = false;
    this._resolve(value);
    return this;
  }

  /**
   * Rejects the result Promise with the provided error.
   * @param {*} error The error value.
   * @returns {this}
   */
  reject(error) {
    this._pending = false;
    this._reject(error);
    return this;
  }

  /**
   * Whether this promise is still pending.
   * @returns {boolean}
   */
  get pending() {
    return this._pending;
  }
}

// necessary to make Promise subclass act like a Promise
QueryResult.prototype.constructor = Promise;
