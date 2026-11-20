// TODO: handle case where identifiers are already quoted?
export function parseIdentifier(id: string) {
  return id.split('.');
}

export function quoteIdentifier(value: string) {
  // escape double quotes if they occur in identifier
  return `"${value.replaceAll('"', '""')}"`;
}

export function unquote(s?: string) {
  return s && isDoubleQuoted(s) ? s.slice(1, -1) : s;
}

function isDoubleQuoted(s: string) {
  return s[0] === '"' && s[s.length-1] === '"';
}

function padZero(value: unknown, len = 2) {
  return `${value}`.padStart(len, '0');
}

export function literalToSQL(value: unknown) {
  switch (typeof value) {
    case 'number':
      return Number.isFinite(value) ? `${value}` : 'NULL';
    case 'string':
      return `'${value.replaceAll('\'', '\'\'')}'`;
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
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
          ? `DATE '${y}-${padZero(m+1)}-${padZero(d)}'` // utc date
          : `epoch_ms(${ts})`; // timestamp
      } else if (value instanceof RegExp) {
        return `'${value.source}'`;
      } else {
        // otherwise rely on string coercion
        return `${value}`;
      }
  }
}
