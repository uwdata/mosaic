/**
 * Synchronizer class to aid synchronization of updates on multiple pending operations.
 */
export class Synchronizer<T = any> {
  private _set: Set<T>;
  private _done: () => void;
  private _promise: Promise<void>;

  /**
   * Create a new synchronizer instance.
   */
  constructor() {
    this._set = new Set<T>();
    this._done = () => {};
    this._promise = new Promise<void>(resolve => this._done = resolve);
  }

  /**
   * Mark an item as pending.
   * @param item An item to synchronize on.
   */
  pending(item: T): void {
    this._set.add(item);
  }

  /**
   * Mark a pending item as ready, indicating it is
   * ready for a synchronized update.
   * @param item An item to synchronize on.
   * @returns True if the synchronizer is ready to
   *  resolve, false otherwise.
   */
  ready(item: T): boolean {
    this._set.delete(item);
    return this._set.size === 0;
  }

  /**
   * Resolve the current synchronization cycle, causing the synchronize
   * promise to resolve and thereby trigger downstream updates.
   */
  resolve(): void {
    this._promise = new Promise<void>(resolve => {
      this._done();
      this._done = resolve;
    });
  }

  /**
   * The promise for the current synchronization cycle.
   * @returns The synchronization promise.
   */
  get promise(): Promise<void> {
    return this._promise;
  }
}

