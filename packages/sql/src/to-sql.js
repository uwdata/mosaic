export function toSQL(value) {
  return typeof value === 'string'
    ? `"${value}"` // strings as column refs
    : literalToSQL(value);
}

export function literalToSQL(value) {
  switch (typeof value) {
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
    case 'string':
      return `'${value}'`;
    default:
      if (value == null) {
        return 'NULL';
      } else if (value instanceof Date) {
        // TODO: date vs. timestamp
        return `MAKE_DATE(${value.getUTCFullYear()}, ${value.getUTCMonth()+1}, ${value.getUTCDate()})`;
      } else if (value instanceof RegExp) {
        return `'${value.source}'`;
      } else {
        return String(value);
      }
  }
}
