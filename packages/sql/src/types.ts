import { ColumnRefNode } from './ast/column-ref.js';
import { ExprNode, SQLNode } from './ast/node.js';
import { TableRefNode } from './ast/table-ref.js';
import { Query } from './ast/query.js';

/**
 * Interface representing a dynamic parameter value.
 */
export interface ParamLike {
  /** The current parameter value. */
  value: any;
  /** Add an event listener callback. */
  addEventListener(type: string, callback: EventCallback): void;
  /** Remove an event listener callback. */
  removeEventListener(type: string, callback: EventCallback): void;
}

/**
 * Expression value input to SQL builder method.
 */
export type ExprValue = ExprNode | ParamLike | string | number | boolean | Date;

/**
 * Expression values that may be nested in arrays.
 */
export type ExprVarArgs = MaybeArray<ExprValue>;

/**
 * String-typed expression value.
 */
export type StringValue = ExprNode | ParamLike | string;

/**
 * Number-typed expression value.
 */
export type NumberValue = ExprNode | ParamLike | number;

/**
 * Event listener callback function.
 */
export type EventCallback = <T>(value: any) => Promise<T> | undefined;

/**
 * SQL AST traversal visitor callback result.
 * A falsy value (including `undefined`, `null`, `false`, and `0`) indicates
 * that traversal should continue.
 * A negative number values indicates that traversal should stop immediately.
 * Any other truthy value indicates that traversal should not recurse on the
 * current node, but should otherwise continue.
 */
export type VisitorResult = boolean | number | null | undefined | void;

/**
 * SQL AST traversal callback function.
 */
export type VisitorCallback = (node: SQLNode) => VisitorResult;

/** Valid window function names. */
export type WindowFunctionName =
  | 'cume_dist'
  | 'dense_rank'
  | 'first_value'
  | 'lag'
  | 'last_value'
  | 'lead'
  | 'nth_value'
  | 'ntile'
  | 'percent_rank'
  | 'rank_dense'
  | 'rank'
  | 'row_number';

export type MaybeArray<T> = T | T[];

export type SelectEntry =
  | string
  | ColumnRefNode
  | [string, ExprNode]
  | Record<string, ExprValue>;

export type SelectExpr = MaybeArray<SelectEntry>;

export type WithExpr = MaybeArray<Record<string, Query>>;

export type FromEntry =
  | string
  | TableRefNode
  | SQLNode
  | [string, SQLNode]
  | Record<string, string | SQLNode>;

export type FromExpr = MaybeArray<FromEntry>;

export type FilterExpr = MaybeArray<string | ExprNode>;
export type GroupByExpr = MaybeArray<string | ExprNode>;
export type OrderByExpr = MaybeArray<string | ExprNode>;
