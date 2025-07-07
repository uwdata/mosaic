
import { isMosaicClient, MosaicClient } from './MosaicClient.js';
import { type ExprNode, type ExprValue, type ScaleOptions, type ScaleDomain, and, contains, isBetween, isIn, isNotDistinct, literal, or, prefix, regexp_matches, suffix, listHasAll, listHasAny } from '@uwdata/mosaic-sql';

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

/**
 * Selection clause metadata indicating selection of one or more discrete
 * point values, typically based on equality or is distinctiveness checks.
 */
export interface PointMetadata extends ClauseMetadata {
  type: 'point';
}

/**
 * Selection clause metadata indicating text search matching.
 */
export interface MatchMetadata extends ClauseMetadata {
  type: MatchMethod;
  /** The text search matching method used. */
  method?: 'contains' | 'prefix' | 'suffix' | 'regexp' | (string & {});
}

/** A binning method name. */
export type BinMethod = 'floor' | 'ceil' | 'round';

/**
 * Selection clause metadata for one or more selected intervals. This
 * metadata can be used to determine appropriate data-space binning
 * schemes that correspond to pixel-level bins in screen space.
 */
export interface IntervalMetadata extends ClauseMetadata {
  type: 'interval';
  /**
   * The interactive pixel size used by the generating component.
   * Values larger than one indicate intervals that "snap-to" values
   * greater than a single pixel. If unspecified, assumed to be `1`.
   */
  pixelSize?: number;
  /**
   * An array of one or more scale descriptors that describe the
   * mapping from data values to screen pixels.
   */
  scales?: ScaleOptions[];
  /**
   * A hint for the binning method to use when discretizing the
   * interval domain. If unspecified, the default is `'floor'`.
   */
  bin?: BinMethod
}

export interface ClauseSource {
  reset?: () => void;
}

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
export function clauseList(field: ExprValue, value: unknown, {
  source,
  clients = isMosaicClient(source) ? new Set([source]) : undefined,
  listType = 'any'
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
  listType?: 'any' | 'all';
}): SelectionClause {
  const listFn = listType === 'all' ? listHasAll : listHasAny;
  const predicate: ExprNode | null = value !== undefined
    ? listFn(field, [literal(value)])
    : null;
  return {
    source,
    clients,
    value,
    predicate
  };
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
export function clausePoint(field: ExprValue, value: unknown, {
  source,
  clients = isMosaicClient(source) ? new Set([source]) : undefined
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
}): SelectionClause {
  const predicate: ExprNode | null = value !== undefined
    ? isIn(field, [literal(value)])
    : null;
  return {
    meta: { type: 'point' },
    source,
    clients,
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
export function clausePoints(fields: ExprValue[], value: unknown[][] | null | undefined, {
  source,
  clients = isMosaicClient(source) ? new Set([source]) : undefined
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
}): SelectionClause {
  let predicate: ExprNode | null = null;
  if (value) {
    const clauses = value.length && fields.length === 1
      ? [isIn(fields[0], value.map(v => literal(v[0])))]
      : value.map(v => and(v.map((_, i) => isNotDistinct(fields[i], literal(_)))));
    predicate = value.length === 0 ? literal(false)
      : clauses.length > 1 ? or(clauses)
      : clauses[0];
  }
  return {
    meta: { type: 'point' },
    source,
    clients,
    value,
    predicate
  };
}

/**
 * Generate a selection clause for a selected 1D interval.
 * @param field The table column or expression to select.
 * @param value The selected interval as a [lo, hi] array.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param options.scale The scale mapping descriptor.
 * @param options.bin A binning method hint.
 * @param options.pixelSize The interactive pixel size.
 * @returns The generated selection clause.
 */
export function clauseInterval(field: ExprValue, value: ScaleDomain | null | undefined, {
  source,
  clients = isMosaicClient(source) ? new Set([source]) : undefined,
  bin,
  scale,
  pixelSize = 1
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
  scale?: ScaleOptions;
  bin?: BinMethod;
  pixelSize?: number;
}): SelectionClause {
  const predicate = value != null ? isBetween(field, value) : null;
  const meta: IntervalMetadata = {
    type: 'interval',
    scales: scale && [scale],
    bin,
    pixelSize
  };
  return { meta, source, clients, value, predicate };
}

/**
 * Generate a selection clause for multiple selected intervals.
 * @param fields The table columns or expressions to select.
 * @param value The selected intervals, as an array of extents.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param options.scales The scale mapping descriptors,
 *  in an order matching the given *fields* and *value* extents.
 * @param options.bin A binning method hint.
 * @param options.pixelSize The interactive pixel size.
 * @returns The generated selection clause.
 */
export function clauseIntervals(fields: ExprValue[], value: ScaleDomain[] | null | undefined, {
  source,
  clients = isMosaicClient(source) ? new Set([source]) : undefined,
  bin,
  scales = [],
  pixelSize = 1
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
  scales?: ScaleOptions[];
  bin?: BinMethod;
  pixelSize?: number;
}): SelectionClause {
  const predicate = value != null
    ? and(fields.map((f, i) => isBetween(f, value[i])))
    : null;
  const meta: IntervalMetadata = {
    type: 'interval',
    scales,
    bin,
    pixelSize
  };
  return { meta, source, clients, value, predicate };
}

const MATCH_METHODS = { contains, prefix, suffix, regexp: regexp_matches };

/** Text search matching methods. */
export type MatchMethod = keyof typeof MATCH_METHODS | (string & {});

/**
 * Generate a selection clause for text search matching.
 * @param field The table column or expression to select.
 * @param value The selected text search query string.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param options.method The text matching method to use. Defaults to `'contains'`.
 * @returns The generated selection clause.
 */
export function clauseMatch(field: ExprValue, value: string | null | undefined, {
  source,
  clients = undefined,
  method = 'contains'
}: {
  source: ClauseSource;
  clients?: Set<MosaicClient>;
  method?: MatchMethod;
}): SelectionClause {
  const fn = MATCH_METHODS[method as keyof typeof MATCH_METHODS];
  const predicate: ExprNode | null = value ? fn(field, literal(value)) : null;
  const meta: MatchMetadata = { type: 'match', method };
  return { meta, source, clients, value, predicate };
}
