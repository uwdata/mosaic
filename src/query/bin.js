import { cast } from './cast.js';

export function bin(field, min, max, steps) {
  const delta = cast(`${field} - ${min}`, 'DOUBLE');
  return `FLOOR(${steps} * (${delta} / (${max} - ${min})))`;
}
