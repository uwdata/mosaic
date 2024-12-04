import { ExprNode } from '@uwdata/mosaic-sql';
import { MosaicClient } from '../MosaicClient.js';

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

/** Text search matching methods. */
export type MatchMethod =
  | 'contains'
  | 'prefix'
  | 'suffix'
  | 'regexp'
  | (string & {});

/**
 * Selection clause metadata indicating text search matching.
 */
export interface MatchMetadata extends ClauseMetadata {
  type: MatchMethod;
  /** The text search matching method used. */
  method?: 'contains' | 'prefix' | 'suffix' | 'regexp' | (string & {});
}

/** Quantitative scale types. */
export type ScaleType =
  | 'identity'
  | 'linear'
  | 'log'
  | 'sqrt'
  | 'pow'
  | 'symlog'
  | 'time'
  | 'utc';

/** A data value interval extent. */
export type Extent = [number, number] | [Date, Date];

/**
 * Descriptor for a scale that maps a data domain to screen pixels.
 */
export interface Scale {
  /** The scale type, such as `'linear'`, `'log'`, etc. */
  type: ScaleType;
  /** The scale domain, as an array of start and end data values. */
  domain: Extent;
  /**
   * The scale range, as an array of start and end screen pixels.
   * The range may be omitted for *identity* scales.
   */
  range?: [number, number];
  /** The base of the logarithm. For `'log'` scales only. */
  base?: number;
  /** The constant parameter. For `'symlog'` scales only. */
  constant?: number;
  /** The exponent parameter. For `'pow'` scales only. */
  exponent?: number;
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
  scales?: Scale[];
  /**
   * A hint for the binning method to use when discretizing the
   * interval domain. If unspecified, the default is `'floor'`.
   */
  bin?: BinMethod
}

/**
 * A selection clause representing filtering criteria
 * to apply within a Mosiac Selection.
 */
export interface SelectionClause {
  /**
   * A unique identifier (according to object equality) for the source
   * component that generated this clause. In many cases, this is a
   * reference to the originating component itself.
   */
  source: any;
  /**
   * A set of Mosaic clients associated with this clause that should not
   * be updated when this clause is applied in a cross-filtering context.
   */
  clients?: Set<MosaicClient>;
  /**
   * A selected value associated with this clause. For example, for a 1D
   * interval selection clause the value may be a [lo, hi] array.
   */
  value: any;
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
