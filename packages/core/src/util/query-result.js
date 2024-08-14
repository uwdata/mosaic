export const QueryState = Object.freeze({
  pending: Symbol('pending'),
  prepared: Symbol('prepared'),
  error: Symbol('error'),
  done: Symbol('done')
});

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
    this._state = QueryState.pending;
    this._value = undefined;
  }

  /**
   * Resolve the result Promise with a prepared value or the provided value.
   * This method will only succeed if either a value is provided or prepared.
   * @param {*} value The result value.
   * @returns {this}
   */
  fulfill(value) {
    if (this._value !== undefined) {
      if (value !== undefined) {
        throw Error('Promise has prepared and provided value');
      }
      this._resolve(this._value);
    } else if (value === undefined) {
      throw Error('Promise has has neither prepared nor provided value');
    } else {
      this._resolve(value);
    }

    this._state = QueryState.done;

    return this;
  }

  /**
   * Prepare to resolve the result Promise with the provided value.
   * @param {*} value The result value.
   * @returns {this}
   */
  prepare(value) {
    this._state = QueryState.prepared;
    this._value = value;
    return this;
  }

  /**
   * Rejects the result Promise with the provided error.
   * @param {*} error The error value.
   * @returns {this}
   */
  reject(error) {
    this._state = QueryState.error;
    this._reject(error);
    return this;
  }

  /**
   * Returns the state of this query result.
   * @returns {symbol}
   */
  get state() {
    return this._state;
  }
}

// necessary to make Promise subclass act like a Promise
QueryResult.prototype.constructor = Promise;
