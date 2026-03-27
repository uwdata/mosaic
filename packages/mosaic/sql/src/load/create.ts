import { CreateQuery, type CreateTableOptions, CreateSchemaQuery, type CreateSchemaOptions, type Query } from "../ast/query.js";
import type { TableRefNode } from "../ast/table-ref.js";

export function createTable(name: string | TableRefNode, query: string | Query, options: CreateTableOptions = {}) {
  return new CreateQuery(name, query, options);
}

export function createSchema(name: string | TableRefNode, options: CreateSchemaOptions = {}) {
  return new CreateSchemaQuery(name, options);
}
