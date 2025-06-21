import { asLiteral } from '../util/ast.js';

type SQLFromOptions = {
  columns?: string[] | Record<string, string>;
} & Record<string,string>;

/**
 * Create a SQL query that embeds the given data for loading.
 * @param data The dataset as an array of objects.
 * @param options Loading options.
 * @param {string[]|object} [options.columns] The columns to include.
 *   If not specified, the keys of the first data object are used.
 * @returns {string} SQL query string to load data.
 */
export function sqlFrom(
  data: (Record<string, unknown>)[],
  {
    columns = Object.keys(data?.[0] || {})
  }: SQLFromOptions = {}
) {
  let keys: string[] = [];
  if (Array.isArray(columns)) {
    keys = columns;
    columns = keys.reduce((m, k) => (m[k] = k, m), {} as Record<string, string>);
  } else if (columns) {
    keys = Object.keys(columns);
  }
  if (!keys.length) {
    throw new Error('Can not create table from empty column set.');
  }
  const subq = [];
  for (const datum of data) {
    const sel = keys.map(k => `${asLiteral(datum[k])} AS "${columns[k]}"`);
    subq.push(`(SELECT ${sel.join(', ')})`);
  }
  return subq.join(' UNION ALL ');
}
