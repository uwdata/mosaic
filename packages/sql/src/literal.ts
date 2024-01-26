import { literalToSQL } from "./to-sql";

export const literal = (value: any) => ({
  value,
  toString: () => literalToSQL(value),
});
