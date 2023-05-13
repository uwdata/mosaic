import { literalToSQL } from './to-sql.js';

export const literal = value => ({
  value,
  toString: () => literalToSQL(value)
});
