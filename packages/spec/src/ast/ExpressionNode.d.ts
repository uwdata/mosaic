export type SpecExpression =
  | { sql: string, label?: string }
  | { agg: string, label?: string };
