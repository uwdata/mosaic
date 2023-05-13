import { sql } from './expression.js';
import { asColumn } from './ref.js';
import { repeat } from './repeat.js';

function func(op) {
  return (...values) => {
    const args = values.map(asColumn);
    const strings = [`${op}(`, ...repeat(args.length - 1, ', '), ')'];
    return sql(strings, ...args).annotate({ func: op, args });
  }
}

export const regexp_matches = func('REGEXP_MATCHES');
export const contains = func('CONTAINS');
export const prefix = func('PREFIX');
export const suffix = func('SUFFIX');
export const lower = func('LOWER');
export const upper = func('UPPER');
export const length = func('LENGTH');
export const isNaN = func('ISNAN');
export const isFinite = func('ISFINITE');
export const isInfinite = func('ISINF');
