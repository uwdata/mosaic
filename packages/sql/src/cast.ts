import { SQLExpression, sql } from "./expression";
import { asColumn } from "./ref";

export function cast(expr: any, type: string): SQLExpression {
  const arg = asColumn(expr);
  const e = sql`CAST(${arg} AS ${type})`;
  Object.defineProperty(e, "label", {
    enumerable: true,
    get() {
      return expr.label;
    },
  });
  Object.defineProperty(e, "aggregate", {
    enumerable: true,
    get() {
      return expr.aggregate || false;
    },
  });
  return e;
}

export const castDouble = (expr: any) => cast(expr, "DOUBLE");
export const castInteger = (expr: any) => cast(expr, "INTEGER");
