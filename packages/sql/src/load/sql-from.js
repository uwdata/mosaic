import { literalToSQL } from '../to-sql.js';

export function sqlFrom(data, {
  columns = Object.keys(data?.[0] || {})
} = {}) {
  let keys = [];
  if (Array.isArray(columns)) {
    keys = columns;
    columns = keys.reduce((m, k) => (m[k] = k, m), {});
  } else if (columns) {
    keys = Object.keys(columns);
  }
  if (!keys.length) {
    throw new Error('Can not create table from empty column set.');
  }
  const subq = [];
  for (const datum of data) {
    const sel = keys.map(k => `${literalToSQL(datum[k])} AS "${columns[k]}"`);
    subq.push(`(SELECT ${sel.join(', ')})`);
  }
  return subq.join(' UNION ALL ');
}
