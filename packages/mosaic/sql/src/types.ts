import { ColumnRefNode } from './ast/column-ref.js';
import { ExprNode, SQLNode } from './ast/node.js';
import { TableRefNode } from './ast/table-ref.js';
import { Query } from './ast/query.js';
import { WithClauseNode } from './ast/with.js';

/**
 * Interface representing a dynamic parameter value.
 */
export interface ParamLike {
  /** The current parameter value. */
  value: unknown;
  /** Add an event listener callback. */
  addEventListener(type: string, callback: EventCallback): void;
  /** Remove an event listener callback. */
  removeEventListener(type: string, callback: EventCallback): void;
}

/**
 * Expression value input to SQL builder method.
 */
export type ExprValue = ExprNode | ParamLike | string | number | boolean | Date | null;

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
export type EventCallback = <T>(value: unknown) => Promise<T> | undefined;

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
  | null
  | string
  | ColumnRefNode
  | [string, ExprNode]
  | Record<string, ExprValue>;

export type SelectExpr = MaybeArray<SelectEntry>;

export type WithEntry =
  | WithClauseNode
  | Record<string, Query>;

export type WithExpr = MaybeArray<WithEntry>;

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
