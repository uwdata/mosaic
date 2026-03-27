import { CreateQuery, type CreateTableOptions } from "../ast/query.js";
import { TableRefNode } from "../ast/table-ref.js";
import { quoteIdentifier } from "../util/string.js";

export type { CreateTableOptions };

export function createTable(name: string | TableRefNode, query: string, options: CreateTableOptions = {}) {
  return new CreateQuery(name, query, options);
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
