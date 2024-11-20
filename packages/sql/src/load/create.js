export function createTable(name, query, {
  replace = false,
  temp = false,
  view = false
} = {}) {
  return 'CREATE'
    + (replace ? ' OR REPLACE ' : ' ')
    + (temp ? 'TEMP ' : '')
    + (view ? 'VIEW' : 'TABLE')
    + (replace ? ' ' : ' IF NOT EXISTS ')
    + name + ' AS ' + query;
}

export function createSchema(name, {
  strict = false
} = {}) {
  return 'CREATE SCHEMA '
    + (strict ? '' : 'IF NOT EXISTS ')
    + name;
}
