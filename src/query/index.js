import { Query } from './Query.js';

export function ref(...path) {
  // TODO? split on '.' as well?
  return path.map(p => `"${p}"`).join('.');
}

export function cast(expr, type) {
  return `CAST(${expr} AS ${type})`;
}

export function select(...args) {
  return new Query().select(...args);
}

export function from(...args) {
  return new Query().from(...args);
}

export function asc(field) {
  return `"${field}" ASC`;
}

export function desc(field) {
  return `"${field}" DESC`;
}

export function isInRange(field, extent) {
  const [min, max] = extent;
  return `${min} <= ${field} AND ${field} <= ${max}`;
}

export function startsWith(field, text) {
  return `prefix(${field}, '${text}')`;
}

export function endsWith(field, text) {
  return `suffix(${field}, '${text}')`;
}

export function contains(field, text) {
  return `contains(${field}, '${text}')`;
}

export function regexp(field, regexp) {
  return `regexp_matches(${field}, '${regexp}')`;
}

export function isNull(field) {
  return `${field} IS NULL`;
}

export function isNotNull(field) {
  return `${field} IS NOT NULL`;
}

export function bin(field, { extent, steps }) {
  const [min, max] = extent;
  const delta = cast(`${field} - ${min}`, 'DOUBLE');
  const span = cast(`${max} - ${min}`, 'DOUBLE');
  return `FLOOR(${steps} * ${delta} / ${span})`;
}

export function count() {
  return 'COUNT(*)';
}

export function min(field) {
  return `MIN(${field})`;
}

export function max(field) {
  return `MAX(${field})`;
}
