export function create(name, query, {
  replace = false,
  temp = true,
  view = false
} = {}) {
  return 'CREATE'
    + (replace ? ' OR REPLACE ' : ' ')
    + (temp ? 'TEMP ' : '')
    + (view ? 'VIEW' : 'TABLE')
    + (replace ? ' ' : ' IF NOT EXISTS ')
    + name + ' AS ' + query;
}
