import type { ExprNode, ExprValue } from '@uwdata/mosaic-sql';
import { asNode, isInDistinct, literal, and, or, isNotDistinct } from '@uwdata/mosaic-sql';
import { isMosaicClient, type MosaicClient } from '../MosaicClient.js';
import type { ClauseMetadata, ClauseSource, SelectionClause } from './SelectionClause.js';

/**
 * Selection clause metadata indicating selection of one or more discrete
 * point values, typically based on equality or is distinctiveness checks.
 */
export interface PointMetadata extends ClauseMetadata {
  type: 'point';
}

/**
 * Options for point-type selection clauses.
 */
export interface PointOptions {
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
}

/**
 * Generate a selection clause for a single selected point value.
 * @param field The table column or expression to select.
 * @param value The selected value.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @returns The generated selection clause.
 */
export function clausePoint(
  field: ExprValue,
  value: unknown, {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined
  }: PointOptions
): SelectionClause {
  field = asNode(field);
  const predicate: ExprNode | null = value !== undefined
    ? isInDistinct(field, [literal(value)])
    : null;
  return {
    meta: { type: 'point' },
    source,
    clients,
    fields: [field],
    value,
    predicate
  };
}

/**
 * Generate a selection clause for multiple selected point values.
 * @param fields The table columns or expressions to select.
 * @param value The selected values, as an array of
 *  arrays. Each subarray contains values for each *fields* entry.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @returns The generated selection clause.
 */
export function clausePoints(
  fields: ExprValue[],
  value: unknown[][] | null | undefined,
  {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined
  }: PointOptions
): SelectionClause {
  fields = fields.map(f => asNode(f));
  let predicate: ExprNode | null = null;
  if (value != null) {
    const clauses = value.length && fields.length === 1
      ? [isInDistinct(fields[0], value.map(v => literal(v[0])))]
      : value.map(v => and(v.map((_, i) => isNotDistinct(fields[i], literal(_)))));
    predicate = value.length === 0 ? literal(false)
      : clauses.length > 1 ? or(clauses)
      : clauses[0];
  }
  return {
    meta: { type: 'point' },
    source,
    clients,
    fields: fields as ExprNode[],
    value,
    predicate
  };
}
