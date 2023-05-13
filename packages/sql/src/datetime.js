import { sql } from './expression.js';
import { asColumn } from './ref.js';

export const epoch_ms = expr => {
  const d = asColumn(expr);
  return sql`(1000 * (epoch(${d}) - second(${d})) + millisecond(${d}))::DOUBLE`;
};
