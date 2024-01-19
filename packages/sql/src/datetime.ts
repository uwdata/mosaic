import { sql } from "./expression";
import { asColumn } from "./ref";

export const epoch_ms = (expr: any) => {
  const d = asColumn(expr);
  return sql`(1000 * (epoch(${d}) - second(${d})) + millisecond(${d}))::DOUBLE`;
};

export const dateMonth = (expr: any) => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, MONTH(${d}), 1)`.annotate({ label: "month" });
};

export const dateMonthDay = (expr: any) => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, MONTH(${d}), DAY(${d}))`.annotate({
    label: "date",
  });
};

export const dateDay = (expr: any) => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, 1, DAY(${d}))`.annotate({ label: "date" });
};
