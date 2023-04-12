export class AsyncDispatch {
  constructor() {
    this._callbacks = new Map;
  }

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

  removeEventListener(type, callback) {
    const entry = this._callbacks.get(type);
    if (entry) {
      entry.callbacks.delete(callback);
    }
  }

  willEmit(type, value) {
    // pass value as-is, superclasses may override
    return value;
  }

  emitQueueFilter() {
    // removes all pending items
    return null;
  }

  cancel(type) {
    const entry = this._callbacks.get(type);
    entry?.queue.clear();
  }

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

export class DispatchQueue {
  constructor() {
    this.clear();
  }

  clear() {
    this.next = null;
  }

  isEmpty() {
    return !this.next;
  }

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
    return this;
  }

  dequeue() {
    const { next } = this;
    this.next = next?.next;
    return next?.value;
  }
}
