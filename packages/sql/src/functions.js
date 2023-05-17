import { sql } from './expression.js';
import { asColumn } from './ref.js';
import { repeat } from './repeat.js';

export function functionCall(op, type) {
  return (...values) => {
    const args = values.map(asColumn);
    const cast = type ? `::${type}` : '';
    const expr = args.length
      ? sql([`${op}(`, ...repeat(args.length - 1, ', '), `)${cast}`], ...args)
      : sql`${op}()${cast}`;
    return expr.annotate({ func: op, args });
  }
}

export const regexp_matches = functionCall('REGEXP_MATCHES');
export const contains = functionCall('CONTAINS');
export const prefix = functionCall('PREFIX');
export const suffix = functionCall('SUFFIX');
export const lower = functionCall('LOWER');
export const upper = functionCall('UPPER');
export const length = functionCall('LENGTH');
export const isNaN = functionCall('ISNAN');
export const isFinite = functionCall('ISFINITE');
export const isInfinite = functionCall('ISINF');
