import { asNode, type ExprValue, listHasAll, listHasAny, literal } from "@uwdata/mosaic-sql";
import { isMosaicClient, type MosaicClient } from "../MosaicClient.js";
import type { ClauseMetadata, ClauseSource, SelectionClause } from "./SelectionClause.js";

/**
 * Selection clause metadata indicating text search matching.
 */
export interface ListMetadata extends ClauseMetadata {
  type: 'list';
  /** The list matching method used. */
  match?: 'any' | 'all';
}

/**
 * Options for list-type selection clauses.
 */
export interface ListOptions {
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
   * How to match list values. One of `'any'` (default,
   *  match if any selected values is in the list, default) or `'all'` (all
   *  selected values must be in the list).
   */
  listMatch?: 'any' | 'all';
}

/**
 * Generate a selection clause for a single selected point value in a list.
 * @param field The table column or expression to select, which must be a list.
 * @param value The selected value.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated with this clause. These
 *  clients are not filtered by this clause in cross-filtering contexts.
 * @param options.listMatch How to match list values. One of `'any'` (default,
 *  match if any selected values is in the list, default) or `'all'` (all
 *  selected values must be in the list).
 * @returns The generated selection clause.
 */
export function clauseList(
  field: ExprValue,
  value: unknown,
  {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined,
    listMatch = 'any'
  }: ListOptions
): SelectionClause {
  field = asNode(field);
  const listFn = listMatch === 'all' ? listHasAll : listHasAny;
  // arrays pass through directly so they are quoted as a list, not stringified
  const predicate = value === undefined || (Array.isArray(value) && value.length === 0)
    ? null
    : Array.isArray(value)
      ? listFn(field, value as ExprValue[])
      : listFn(field, literal(value));
  const meta: ListMetadata = { type: 'list', match: listMatch };
  return {
    meta,
    source,
    clients,
    fields: [field],
    value,
    predicate
  };
}
