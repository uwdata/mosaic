import { distinct } from './util/distinct.js';

export function isParam(x) {
  return x instanceof Param;
}

export class Param {
  constructor(value) {
    this._value = value;
    this._listeners = new Map;
  }

  static value(value) {
    return new Param(value);
  }

  get value() {
    return this._value;
  }

  update(value, { force } = {}) {
    const changed = distinct(this._value, value);
    if (changed) this._value = value;
    if (changed || force) this.emit('value', this.value);
    return this;
  }

  addEventListener(type, callback) {
    let list = this._listeners.get(type) || [];
    if (list.indexOf(callback) < 0) {
      list = list.concat(callback);
    }
    this._listeners.set(type, list);
  }

  removeEventListener(type, callback) {
    const list = this._listeners.get(type);
    if (list?.length) {
      this._listeners.set(type, list.filter(x => x !== callback));
    }
  }

  emit(type, event) {
    this._listeners.get(type)?.forEach(l => l(event));
  }
}
