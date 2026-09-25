import type { ExprNode, ExprValue, ScaleDomain, ScaleOptions } from '@uwdata/mosaic-sql';
import { and, asNode, isBetween } from '@uwdata/mosaic-sql';
import { isMosaicClient, type MosaicClient } from '../MosaicClient.js';
import type { ClauseMetadata, ClauseSource, SelectionClause } from './SelectionClause.js';

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

/**
 * Options for interval-type selection clauses.
 */
export interface IntervalOptions {
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
   * A hint for the binning method to use when discretizing the
   * interval domain. If unspecified, the default is `'floor'`.
   */
  bin?: BinMethod;
  /**
   * The interactive pixel size used by the generating component.
   * Values larger than one indicate intervals that "snap-to" values
   * greater than a single pixel. If unspecified, assumed to be `1`.
   */
  pixelSize?: number;
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
export function clauseInterval(
  field: ExprValue,
  value: ScaleDomain | null | undefined,
  {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined,
    bin,
    scale,
    pixelSize = 1
  }: IntervalOptions & { scale?: ScaleOptions }
): SelectionClause {
  field = asNode(field);
  const predicate = value != null ? isBetween(field, value) : null;
  const meta: IntervalMetadata = {
    type: 'interval',
    scales: scale && [scale],
    bin,
    pixelSize
  };
  return { meta, source, clients, fields: [field], value, predicate };
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
export function clauseIntervals(
  fields: ExprValue[],
  value: ScaleDomain[] | null | undefined,
  {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined,
    bin,
    scales = [],
    pixelSize = 1
  }: IntervalOptions & { scales?: ScaleOptions[] }
): SelectionClause {
  fields = fields.map(f => asNode(f));
  const predicate = value != null
    ? and(fields.map((f, i) => isBetween(f, value[i])))
    : null;
  const meta: IntervalMetadata = {
    type: 'interval',
    scales,
    bin,
    pixelSize
  };
  return {
    meta,
    source,
    clients,
    fields: fields as ExprNode[],
    value,
    predicate
  };
}