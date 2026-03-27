import { CreateQuery, type CreateTableOptions, CreateSchemaQuery, type CreateSchemaOptions, Query } from "../ast/query.js";
import { TableRefNode } from "../ast/table-ref.js";

export type { CreateTableOptions, CreateSchemaOptions };

export function createTable(name: string | TableRefNode, query: string | Query, options: CreateTableOptions = {}) {
  return new CreateQuery(name, query, options);
}

export function createSchema(name: string | TableRefNode, options: CreateSchemaOptions = {}) {
  return new CreateSchemaQuery(name, options);
}
