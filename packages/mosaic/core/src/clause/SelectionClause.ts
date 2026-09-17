import type { ExprNode } from '@uwdata/mosaic-sql';
import type { MosaicClient } from '../MosaicClient.js';

/**
 * Selection clause metadata to guide possible query optimizations.
 * Sub-interfaces provide more information about the specifics of a
 * given selection based on the selection type.
 */
export interface ClauseMetadata {
  /**
   * The selection type, such as `'point'`, `'interval'`, or `'match'`.
   */
  type: string;
}

export type ClauseSource = object & { reset?: () => void; };

/**
 * A selection clause representing filtering criteria
 * to apply within a Mosaic Selection.
 */
export interface SelectionClause {
  /**
   * A unique identifier (according to object equality) for the source
   * component that generated this clause. In many cases, this is a
   * reference to the originating component itself.
   */
  source: ClauseSource;
  /**
   * A set of Mosaic clients associated with this clause that should not
   * be updated when this clause is applied in a cross-filtering context.
   */
  clients?: Set<MosaicClient>;
  /**
   * The input expressions that this clause filters over. All field
   * references within the *predicate* should be strictly equal to
   * these field expression node instances.
   */
  fields: ExprNode[];
  /**
   * A selected value associated with this clause. For example, for a 1D
   * interval selection clause the value may be a [lo, hi] array.
   */
  value: unknown;
  /**
   * A predicate SQL expression suitable for use in a query WHERE clause.
   * The predicate should apply filtering criteria consistent with this
   * clause's *value* property.
   */
  predicate: ExprNode | null;
  /**
   * Optional clause metadata that varies based on the selection type.
   * The metadata can be used to optimize selection queries, for example
   * by creating materialized views of pre-aggregated data when applicable.
   */
  meta?: ClauseMetadata;
}

/**
 * Generate an empty selection clause for a clause source. This clause
 * will clear any predicates associated with the source.
 * @param source The clause source to clear.
 * @returns The generated selection clause.
 */
export function clauseNone(
  source: ClauseSource
): SelectionClause {
  return { source, fields: [], value: null, predicate: null };
}
