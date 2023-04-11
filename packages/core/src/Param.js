import { AsyncDispatch } from './util/AsyncDispatch.js';
import { distinct } from './util/distinct.js';

export function isParam(x) {
  return x instanceof Param;
}

export class Param extends AsyncDispatch {
  constructor(value) {
    super();
    this._value = value;
  }

  static value(value) {
    return new Param(value);
  }

  get value() {
    return this._value;
  }

  update(value, { force } = {}) {
    const shouldEmit = distinct(this._value, value) || force;
    if (shouldEmit) {
      this.emit('value', value);
    } else {
      this.cancel('value');
    }
    return this;
  }

  willEmit(type, value) {
    if (type === 'value') {
      this._value = value;
    }
    return value;
  }
}
