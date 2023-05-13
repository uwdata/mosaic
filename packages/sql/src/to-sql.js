/**
 * Convert a value to a corresponding SQL string.
 * Input string values are assumed to be column references,
 * otherwise the logic of literalToSQL applies.
 * @param {*} value The value to convert to SQL.
 * @returns {string} A SQL string.
 */
export function toSQL(value) {
  return typeof value === 'string'
    ? `"${value}"` // strings as column refs
    : literalToSQL(value);
}

/**
 * Convert a literal value to a corresponding SQL string.
 * The values null, undefined, Infinity, NaN, and invalid
 * dates are converted to SQL NULL values.
 * UTC dates map to the SQL Date type, otherwise JavaScript
 * date values map to the SQL Timestamp type.
 * Values that are not JavaScript Date, RegExp, or primitive types
 * are coerced to strings, relying on a defined toString method.
 * @param {*} value The literal value.
 * @returns {string} A SQL string.
 */
export function literalToSQL(value) {
  switch (typeof value) {
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
    case 'string':
      return `'${value}'`;
    case 'number':
      return Number.isFinite(value) ? String(value) : 'NULL';
    default:
      if (value == null) {
        return 'NULL';
      } else if (value instanceof Date) {
        const ts = +value;
        if (Number.isNaN(ts)) return 'NULL';
        const y = value.getUTCFullYear();
        const m = value.getUTCMonth();
        const d = value.getUTCDate();
        return ts === Date.UTC(y, m, d)
          ? `MAKE_DATE(${y}, ${m+1}, ${d})` // utc date
          : `EPOCH_MS(${ts})`; // timestamp
      } else if (value instanceof RegExp) {
        return `'${value.source}'`;
      } else {
        // otherwise rely on string coercion
        return String(value);
      }
  }
}
