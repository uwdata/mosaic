import { QueryType } from "../types.js";

function asError(value: unknown) {
  return value instanceof Error
    ? value
    : new Error(`${value}`);
}

export class QueryError extends Error {
  #sql: string;

  get sql() {
    return this.#sql;
  }

  constructor(err: unknown, query: QueryType) {
    const cause = asError(err)
    const sql = `${query}`;
    const msg = `${cause.message}\n\nSQL Query: ${sql}`;
    super(msg, { cause });
    this.#sql = sql;
  }
}
