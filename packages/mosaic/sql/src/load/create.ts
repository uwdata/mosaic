import { TableRefNode } from "../ast/table-ref.js";
import { quoteIdentifier } from "../util/string.js";

export interface CreateTableOptions {
  replace?: boolean;
  temp?: boolean;
  view?: boolean;
}

export function createTable(name: string | TableRefNode, query: string, {
  replace = false,
  temp = false,
  view = false
}: CreateTableOptions = {}) {
  return 'CREATE'
    + (replace ? ' OR REPLACE ' : ' ')
    + (temp ? 'TEMP ' : '')
    + (view ? 'VIEW' : 'TABLE')
    + (replace ? ' ' : ' IF NOT EXISTS ')
    + tableName(name) + ' AS ' + query;
}

export function createSchema(name: string | TableRefNode, {
  strict = false
} = {}) {
  return 'CREATE SCHEMA '
    + (strict ? '' : 'IF NOT EXISTS ')
    + tableName(name);
}

function tableName(name: string | TableRefNode) {
  return typeof name === "string" ? quoteIdentifier(name) : name;
}
