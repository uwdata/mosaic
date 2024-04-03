export type Expression =
  | SQLExpression
  | AggregateExpression;

export interface SQLExpression {
  sql: string;
  label?: string;
}

export interface AggregateExpression {
  agg: string;
  label?: string;
}
