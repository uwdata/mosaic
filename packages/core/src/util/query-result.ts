export const QueryState = Object.freeze({
  pending: Symbol('pending'),
  ready: Symbol('ready'),
  error: Symbol('error'),
  done: Symbol('done')
});

type QueryStateType = typeof QueryState[keyof typeof QueryState];

/**
 * A query result Promise that can allows external callers
 * to resolve or reject the Promise.
 */
export class QueryResult<T = any> extends Promise<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: any) => void;
  private _state: QueryStateType;
  private _value: T | undefined;

  /**
   * Create a new query result Promise.
   */
  constructor() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    super((r, e) => {
      resolve = r;
      reject = e;
    });
    this._resolve = resolve!;
    this._reject = reject!;
    this._state = QueryState.pending;
    this._value = undefined;
  }

  /**
   * Resolve the result Promise with a prepared value or the provided value.
   * This method will only succeed if either a value is provided or the promise is ready.
   * @param value The result value.
   * @returns This QueryResult instance.
   */
  fulfill(value?: T): this {
    if (this._value !== undefined) {
      if (value !== undefined) {
        throw Error('Promise is ready and fulfill has a provided value');
      }
      this._resolve(this._value);
    } else if (value === undefined) {
      throw Error('Promise is neither ready nor has provided value');
    } else {
      this._resolve(value);
    }

    this._state = QueryState.done;

    return this;
  }

  /**
   * Prepare to resolve with the provided value.
   * @param value The result value.
   * @returns This QueryResult instance.
   */
  ready(value: T): this {
    this._state = QueryState.ready;
    this._value = value;
    return this;
  }

  /**
   * Rejects the result Promise with the provided error.
   * @param error The error value.
   * @returns This QueryResult instance.
   */
  reject(error: any): this {
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
(QueryResult.prototype as any).constructor = Promise;