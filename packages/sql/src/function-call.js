import { asColumn } from './ref.js';
import { toSQL } from './to-sql.js';

export class FunctionCall {
  constructor(func, args) {
    this.func = func;
    this.args = (args || []).map(asColumn);
  }

  get column() {
    return this.columns[0];
  }

  get columns() {
    return this.args.flatMap(a => a.columns || []);
  }

  toString() {
    const { func, args } = this;
    return `${func}(${args.map(toSQL).join(', ')})`;
  }
}

function func(op) {
  return (...args) => new FunctionCall(op, args);
}

export const regexp_matches = func('regexp_matches');
export const contains = func('contains');
export const prefix = func('prefix');
export const suffix = func('suffix');
export const lower = func('lower');
export const upper = func('upper');
export const length = func('length');
export const isNaN = func('isnan');
export const isFinite = func('isfinite');
export const isInfinite = func('isinf');
