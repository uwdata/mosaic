/**
 * Event dispatcher supporting asynchronous updates.
 * If an event handler callback returns a Promise, this dispatcher will
 * wait for all such Promises to settle before dispatching future events
 * of the same type.
 */
export class AsyncDispatch {

  /**
   * Create a new asynchronous dispatcher instance.
   */
  constructor() {
    this._callbacks = new Map;
  }

  /**
   * Add an event listener callback for the provided event type.
   * @param {string} type The event type.
   * @param {(value: *) => Promise?} callback The event handler
   *  callback function to add. If the callback has already been
   *  added for the event type, this method has no effect.
   */
  addEventListener(type, callback) {
    if (!this._callbacks.has(type)) {
      this._callbacks.set(type, {
        callbacks: new Set,
        pending: null,
        queue: new DispatchQueue()
      });
    }
    const entry = this._callbacks.get(type);
    entry.callbacks.add(callback);
  }

  /**
   * Remove an event listener callback for the provided event type.
   * @param {string} type The event type.
   * @param {(value: *) => Promise?} callback The event handler
   *  callback function to remove.
   */
  removeEventListener(type, callback) {
    const entry = this._callbacks.get(type);
    if (entry) {
      entry.callbacks.delete(callback);
    }
  }

  /**
   * Lifecycle method that returns the event value to emit.
   * This default implementation simply returns the input value as-is.
   * Subclasses may override this method to implement custom transformations
   * prior to emitting an event value to all listeners.
   * @param {string} type The event type.
   * @param {*} value The event value.
   * @returns The (possibly transformed) event value to emit.
   */
  willEmit(type, value) {
    return value;
  }

  /**
   * Lifecycle method that returns a filter function for updating the
   * queue of unemitted event values prior to enqueueing a new value.
   * This default implementation simply returns null, indicating that
   * any other unemitted event values should be dropped (that is, all
   * queued events are filtered)
   * @param {*} value The new event value that will be enqueued.
   * @returns {(value: *) => boolean|null} A dispatch queue filter
   *  function, or null if all unemitted event values should be filtered.
   */
  emitQueueFilter() {
    // removes all pending items
    return null;
  }

  /**
   * Cancel all unemitted event values for the given event type.
   * @param {string} type The event type.
   */
  cancel(type) {
    const entry = this._callbacks.get(type);
    entry?.queue.clear();
  }

  /**
   * Emit an event value to listeners for the given event type.
   * If a previous emit has not yet resolved, the event value
   * will be queued to be emitted later.
   * The actual event value given to listeners will be the result
   * of passing the input value through the emitValue() method.
   * @param {string} type The event type.
   * @param {*} value The event value.
   */
  emit(type, value) {
    const entry = this._callbacks.get(type) || {};
    if (entry.pending) {
      entry.queue.enqueue(value, this.emitQueueFilter(type, value));
    } else {
      const event = this.willEmit(type, value);
      const { callbacks, queue } = entry;
      if (callbacks?.size) {
        const promise = Promise
          .allSettled(Array.from(callbacks, callback => callback(event)))
          .then(() => {
            entry.pending = null;
            if (!queue.isEmpty()) {
              this.emit(type, queue.dequeue());
            }
          });
        entry.pending = promise;
      }
    }
  }
}

/**
 * Queue for managing unemitted event values.
 */
export class DispatchQueue {

  /**
   * Create a new dispatch queue instance.
   */
  constructor() {
    this.clear();
  }

  /**
   * Clear the queue state of all event values.
   */
  clear() {
    this.next = null;
  }

  /**
   * Indicate if the queue is empty.
   * @returns {boolean} True if queue is empty, false otherwise.
   */
  isEmpty() {
    return !this.next;
  }

  /**
   * Add a new value to the queue, and optionally filter the
   * current queue content in response.
   * @param {*} value The value to add.
   * @param {(value: *) => boolean} [filter] An optional filter
   *  function to apply to existing queue content. If unspecified
   *  or falsy, all previously queued values are removed. Otherwise,
   *  the provided function is applied to all queue entries. The
   *  entry is retained if the filter function returns a truthy value,
   *  otherwise the entry is removed.
   */
  enqueue(value, filter) {
    const tail = { value };
    if (filter && this.next) {
      let curr = this;
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
   * @returns {*} The next event value in the queue.
   */
  dequeue() {
    const { next } = this;
    this.next = next?.next;
    return next?.value;
  }
}
