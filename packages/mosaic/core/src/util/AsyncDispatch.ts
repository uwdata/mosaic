export type EventCallback<T = unknown> = (value: T) => void | Promise<unknown>;

interface DispatchEntry<T = unknown> {
  callbacks: Set<EventCallback<T>>;
  pending: Promise<unknown> | null;
  queue: DispatchQueue<T>;
}

interface QueueNode<T = unknown> {
  value: T;
  next?: QueueNode<T> | null;
}

/**
 * Abstract base class for event dispatchers.
 * Provides common event listener management and lifecycle methods.
 */
export abstract class Dispatch<T> {
  protected _callbacks: Map<string, Set<EventCallback<T>>>;

  constructor() {
    this._callbacks = new Map();
  }

  /**
   * Add an event listener callback for the provided event type.
   * @param type The event type.
   * @param callback The event handler
   *  callback function to add. If the callback has already been
   *  added for the event type, this method has no effect.
   */
  addEventListener(type: string, callback: EventCallback<T>): void {
    if (!this._callbacks.has(type)) {
      this._callbacks.set(type, new Set<EventCallback<T>>());
    }
    const callbacks = this._callbacks.get(type)!;
    callbacks.add(callback);
  }

  /**
   * Remove an event listener callback for the provided event type.
   * @param type The event type.
   * @param callback The event handler
   *  callback function to remove.
   */
  removeEventListener(type: string, callback: EventCallback<T>): void {
    const callbacks = this._callbacks.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Lifecycle method that returns the event value to emit.
   * This default implementation simply returns the input value as-is.
   * Subclasses may override this method to implement custom transformations
   * prior to emitting an event value to all listeners.
   * @param type The event type.
   * @param value The event value.
   * @returns The (possibly transformed) event value to emit.
   */
  willEmit(type: string, value: T): T {
    return value;
  }

  /**
   * Lifecycle method that returns a filter function for updating the
   * queue of un-emitted event values prior to enqueueing a new value.
   * This default implementation simply returns null, indicating that
   * unknown other un-emitted event values should be dropped (that is, all
   * queued events are filtered).
   * @param type The event type.
   * @param value The new event value that will be enqueued.
   * @returns A dispatch queue filter
   *  function, or null if all un-emitted event values should be filtered.
   */
  emitQueueFilter(
    _type: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _value: unknown // eslint-disable-line @typescript-eslint/no-unused-vars
  ): ((value: unknown) => boolean | null) | null {
    // removes all pending items
    return null;
  }

  /**
   * Cancel all un-emitted event values for the given event type.
   * @param _type The event type.
   */
  cancel(_type: string): void {}

  /**
   * Emit an event value to listeners for the given event type.
   * @param type The event type.
   * @param value The event value.
   */
  abstract emit(type: string, value: T): void;
}

/**
 * Event dispatcher supporting asynchronous updates. If an event handler
 * callback returns a Promise, the dispatcher waits for all such Promises
 * to settle before dispatching future events of the same type.
 */
export class AsyncDispatch<T> extends Dispatch<T> {
  private _entries: Map<string, DispatchEntry<T>>;

  /**
   * Create a new asynchronous dispatcher instance.
   */
  constructor() {
    super();
    this._entries = new Map();
  }

  /**
   * Add an event listener callback for the provided event type.
   * @param type The event type.
   * @param callback The event handler
   *  callback function to add. If the callback has already been
   *  added for the event type, this method has no effect.
   */
  override addEventListener(type: string, callback: EventCallback<T>): void {
    super.addEventListener(type, callback);
    if (!this._entries.has(type)) {
      this._entries.set(type, {
        callbacks: this._callbacks.get(type)!,
        pending: null,
        queue: new DispatchQueue<T>(),
      });
    }
  }

  /**
   * Cancel all un-emitted event values for the given event type.
   * @param type The event type.
   */
  override cancel(type: string): void {
    const entry = this._entries.get(type);
    entry?.queue.clear();
  }

  /**
   * Returns a promise that resolves when unknown pending updates complete for
   * the event of the given type currently being processed. The Promise will
   * resolve immediately if the queue for the given event type is empty.
   * @param type The event type to wait for.
   * @returns A pending event promise.
   */
  async pending(type: string): Promise<void> {
    await this._entries.get(type)?.pending;
  }

  /**
   * Emit an event value to listeners for the given event type.
   * If a previous emit has not yet resolved, the event value
   * will be queued to be emitted later.
   * The actual event value given to listeners will be the result
   * of passing the input value through the willEmit() method.
   * @param type The event type.
   * @param value The event value.
   */
  override emit(type: string, value: T): void {
    if (!this._entries.has(type)) {
      this._entries.set(type, {
        callbacks: this._callbacks.get(type) || new Set<EventCallback<T>>(),
        pending: null,
        queue: new DispatchQueue<T>(),
      });
    }
    const entry = this._entries.get(type)!;
    if (entry.pending) {
      // an earlier emit is still processing
      // enqueue the current update, possibly filtering other pending updates
      entry.queue.enqueue(value, this.emitQueueFilter(type, value));
    } else {
      const event = this.willEmit(type, value);
      const { callbacks, queue } = entry;
      if (callbacks?.size) {
        // broadcast update to callbacks, which may return promises
        // wait until promises resolve, then process pending updates
        const callbackValues = Array.from(callbacks, (cb) => cb(event));
        entry.pending = Promise.allSettled(callbackValues).then(() => {
          entry.pending = null;
          if (!queue.isEmpty()) {
            this.emit(type, queue.dequeue()!);
          }
        });
      }
    }
  }
}

/**
 * Queue for managing un-emitted event values.
 */
export class DispatchQueue<T = unknown> {
  next: QueueNode<T> | null = null;

  /**
   * Create a new dispatch queue instance.
   */
  constructor() {
    this.clear();
  }

  /**
   * Clear the queue state of all event values.
   */
  clear(): void {
    this.next = null;
  }

  /**
   * Indicate if the queue is empty.
   * @returns True if queue is empty, false otherwise.
   */
  isEmpty(): boolean {
    return !this.next;
  }

  /**
   * Add a new value to the queue, and optionally filter the
   * current queue content in response.
   * @param value The value to add.
   * @param filter An optional filter
   *  function to apply to existing queue content. If unspecified
   *  or falsy, all previously queued values are removed. Otherwise,
   *  the provided function is applied to all queue entries. The
   *  entry is retained if the filter function returns a truthy value,
   *  otherwise the entry is removed.
   */
  enqueue(value: T, filter?: ((value: T) => boolean | null) | null): void {
    const tail: QueueNode<T> = { value };
    if (filter && this.next) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let curr: QueueNode<T> | DispatchQueue<T> = this;
      while (curr.next) {
        if (filter(curr.next.value)) {
          curr = curr.next;
        } else {
          curr.next = curr.next.next;
        }
      }
      curr.next = tail;
    } else {
      this.next = tail;
    }
  }

  /**
   * Remove and return the next queued event value.
   * @returns The next event value in the queue.
   */
  dequeue(): T | undefined {
    const { next } = this;
    this.next = next?.next || null;
    return next?.value;
  }
}