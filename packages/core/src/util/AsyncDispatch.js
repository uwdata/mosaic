export class AsyncDispatch {
  constructor() {
    // TODO: use single map with { callbacks, pending } object?
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

  emit(type, value) {
    const pending = this._pending.get(type);
    if (pending) {
      pending.next = { value };
    } else {
      const event = this.willEmit(type, value);
      const list = this._callbacks.get(type);
      if (list) {
        const promise = Promise
          .allSettled(list.map(callback => callback(event)))
          .then(() => {
            this._pending.delete(type);
            if (promise.next) {
              this.emit(type, promise.next.value);
            }
          });
        this._pending.set(type, promise);
      }
    }
  }
}
