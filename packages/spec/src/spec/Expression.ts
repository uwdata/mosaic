export type Expression =
  | SQLExpression
  | AggregateExpression;

/** A custom SQL expression. */
export interface SQLExpression {
  /**
   * A SQL expression string to derive a new column value.
   * Embedded Param refrences, such as `$param + 1`, are supported.
   * For expressions with aggregate functions, use *agg* instead.
   */
  sql: string;
  /**
   * A label for this expression, for example to label a plot axis.
   */
  label?: string;
}

/** A custom SQL aggregate expression. */
export interface AggregateExpression {
  /**
   * A SQL expression string to calculate an aggregate value.
   * Embedded Param references, such as `SUM($param + 1)`, are supported.
   * For expressions without aggregate functions, use *sql* instead.
   */
  agg: string;
  /**
   * A label for this expression, for example to label a plot axis.
   */
  label?: string;
}
