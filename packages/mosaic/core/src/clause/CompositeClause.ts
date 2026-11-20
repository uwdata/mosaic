import type { ExprNode, ExprValue, ScaleDomain } from '@uwdata/mosaic-sql';
import { and, asNode, isBetween, isInDistinct, literal } from '@uwdata/mosaic-sql';
import { isMosaicClient, type MosaicClient } from '../MosaicClient.js';
import type { IntervalBinning, IntervalDimension } from './IntervalClause.js';
import type { PointMetadata } from './PointClause.js';
import type { ClauseMetadata, ClauseSource, SelectionClause } from './SelectionClause.js';

/**
 * Metadata for a single dimension of a composite selection clause.
 * Interval dimensions take a [lo, hi] value, point dimensions take an
 * array of selected values, and a null value indicates no filtering.
 */
export type ClauseDimension = IntervalDimension | PointMetadata;

/**
 * Selection clause metadata for a composite selection, in which each field
 * is independently constrained by either an interval or a set of point
 * values. The selection is the cross product of the per-dimension
 * selections, for example a 2D brush over one continuous and one discrete
 * axis.
 */
export interface CompositeMetadata extends ClauseMetadata {
  type: 'composite';
  /** Per-field dimension metadata, in an order matching the clause fields. */
  dims: ClauseDimension[];
}

/**
 * An interval dimension input for a composite selection clause.
 */
export interface CompositeIntervalDimension extends IntervalDimension {
  /** The table column or expression to select. */
  field: ExprValue;
  /** The selected interval as a [lo, hi] array, or null for no filter. */
  value?: ScaleDomain | null;
}

/**
 * A point dimension input for a composite selection clause.
 */
export interface CompositePointDimension extends PointMetadata {
  /** The table column or expression to select. */
  field: ExprValue;
  /** The selected point values, or null for no filter. */
  value?: unknown[] | null;
}

/** A dimension input for a composite selection clause. */
export type CompositeDimension = CompositeIntervalDimension | CompositePointDimension;

/**
 * Options for composite-type selection clauses. The interval binning
 * options provide defaults for interval dimensions that do not specify
 * their own.
 */
export interface CompositeOptions extends IntervalBinning {
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
 * Generate a selection clause for a composite selection over multiple
 * fields, each constrained by either an interval or a set of point values.
 * A dimension with a null value does not filter its field. If all dimension
 * values are null, the clause value and predicate are null.
 * @param dims The selection dimensions. Each dimension has a *type*
 *  (`'interval'` or `'point'`), a *field* to select, and a selected *value*:
 *  a [lo, hi] extent for intervals or an array of values for points.
 *  Interval dimensions may also include *scale*, *pixelSize*, and *bin*
 *  properties.
 * @param options Additional clause properties.
 * @param options.source The source component generating this clause.
 * @param options.clients The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param options.pixelSize The default interactive pixel size for
 *  interval dimensions.
 * @param options.bin The default binning method hint for interval
 *  dimensions.
 * @returns The generated selection clause.
 */
export function clauseComposite(
  dims: CompositeDimension[],
  {
    source,
    clients = isMosaicClient(source) ? new Set([source]) : undefined,
    pixelSize,
    bin
  }: CompositeOptions
): SelectionClause {
  const fields = dims.map(d => asNode(d.field));
  const preds = dims.flatMap((d, i) => d.value == null ? []
    : d.type === 'interval' ? isBetween(fields[i], d.value)
    : isInDistinct(fields[i], d.value.map(v => literal(v)))
  );
  const meta: CompositeMetadata = {
    type: 'composite',
    dims: dims.map(d => d.type === 'interval'
      ? {
          type: 'interval',
          scale: d.scale,
          pixelSize: d.pixelSize ?? pixelSize,
          bin: d.bin ?? bin
        }
      : { type: 'point' }
    )
  };
  return {
    meta,
    source,
    clients,
    fields: fields as ExprNode[],
    value: preds.length ? dims.map(d => d.value ?? null) : null,
    predicate: preds.length === 0 ? null
      : preds.length === 1 ? preds[0]
      : and(preds)
  };
}
