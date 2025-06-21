export interface CreateTableOptions {
  replace?: boolean;
  temp?: boolean;
  view?: boolean;
}

export function createTable(name: string, query: string, {
  replace = false,
  temp = false,
  view = false
}: CreateTableOptions = {}) {
  return 'CREATE'
    + (replace ? ' OR REPLACE ' : ' ')
    + (temp ? 'TEMP ' : '')
    + (view ? 'VIEW' : 'TABLE')
    + (replace ? ' ' : ' IF NOT EXISTS ')
    + name + ' AS ' + query;
}

export function createSchema(name: string, {
  strict = false
} = {}) {
  return 'CREATE SCHEMA '
    + (strict ? '' : 'IF NOT EXISTS ')
    + name;
}
