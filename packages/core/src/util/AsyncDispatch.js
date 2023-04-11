export class AsyncDispatch {
  constructor() {
    this._callbacks = new Map;
    this._pending = new Map;
  }

  addEventListener(type, callback) {
    const list = this._callbacks.get(type) || [];
    if (!list.includes(callback)) {
      this._callbacks.set(type, list.concat(callback));
    }
  }

  removeEventListener(type, callback) {
    const list = this._callbacks.get(type);
    if (list?.length) {
      this._callbacks.set(type, list.filter(x => x !== callback));
    }
  }

  willEmit(type, value) {
    // pass value as-is, superclasses may override
    return value;
  }

  cancel(type) {
    const pending = this._pending.get(type);
    if (pending) {
      pending.next = null;
    }
  }

  queueEmit(type, value) {
    return { value };
  }

  emit(type, value, chain) {
    const pending = this._pending.get(type);
    if (pending) {
      const { next } = pending;
      pending.next = this.queueEmit(type, value, next);
    } else {
      const event = this.willEmit(type, value);
      const list = this._callbacks.get(type);
      if (list) {
        const promise = Promise
          .allSettled(list.map(callback => callback(event)))
          .then(() => {
            this._pending.delete(type);
            const { next } = promise;
            if (next) {
              this.emit(type, next.value, next.next);
            }
          });
        promise.next = chain;
        this._pending.set(type, promise);
      }
    }
  }
}
