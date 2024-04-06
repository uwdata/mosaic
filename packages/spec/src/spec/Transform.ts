import { ParamRef } from './Param.js';

/** A field argument to a data transform. */
export type TransformField = string | ParamRef;

/** Window transform options. */
export interface WindowOptions {
  orderby?: TransformField | TransformField[];
  partitionby?: TransformField | TransformField[];
  rows?: (number | null)[] | ParamRef;
  range?: (number | null)[] | ParamRef;
}

/** Aggregate transform options. */
export interface AggregateOptions {
  distinct?: boolean;
}

/** A transform argument. */
type Arg = string | number | boolean;

/** A zero argument transform signature. */
type Arg0 = null | [];

/** A single argument transform signature. */
type Arg1 = Arg | [Arg];

/**
 * A two argument transform signature; both arguments are required.
 */
type Arg2 = [Arg, Arg];

/**
 * A two argument transform signature; the second argument is optional.
 */
type Arg2Opt = Arg | [Arg, Arg?];

/**
 * A three argument transform signature; the
 * second and third arguments are optional.
 */
type Arg3Opt = Arg | [Arg, Arg?, Arg?];

/** Bin transform options. */
export interface BinOptions {
  /**
   * The target number of binning steps to use. To accommodate human-friendly
   * bin boundaries, the actual number of bins may diverge from this exact number.
   */
  steps?: number;
  /**
   * The minimum allowed bin step size (default `0`).
   * For example, a setting of `1` will prevent step sizes less than 1.
   */
  minstep?: number;
  /**
   * A flag requesting "nice" human-friendly step sizes (default `true`).
   */
  nice?: true;
  /**
   * Offset for computed bins (default `0`). For example, a value of `1` will
   * result in using the next consecutive bin boundary.
   */
  offset?: number;
}

/* A bin transform. */
export interface Bin {
  /**
   * Bin a continuous variable into discrete intervals. This transform accepts
   * a data column to bin over as well as an optional bin options object.
   */
  bin: Arg | [Arg] | [Arg, BinOptions];
}

/* A dateMonth transform. */
export interface DateMonth {
  /**
   * Transform a Date value to a month boundary for cyclic comparison.
   * Year values are collapsed to enable comparison over months only.
   */
  dateMonth: Arg1;
}

/* A dateMonthDay transform. */
export interface DateMonthDay {
  /**
   * Transform a Date value to a month and day boundary for cyclic comparison.
   * Year values are collapsed to enable comparison over months and days only.
   */
  dateMonthDay: Arg1;
}

/* A dateDay transform. */
export interface DateDay {
  /**
   * Transform a Date value to a day of the month for cyclic comparison.
   * Year and month values are collapsed to enable comparison over days only.
   */
  dateDay: Arg1;
}

/* A centroid transform. */
export interface Centroid {
  /**
   * Compute the 2D centroid of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroid: Arg1;
}

/* A centroidX transform. */
export interface CentroidX {
  /**
   * Compute the centroid x-coordinate of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroidX: Arg1;
}

/* A centroidY transform. */
export interface CentroidY {
  /**
   * Compute the centroid y-coordinate of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroidY: Arg1;
}

/* A geojson transform. */
export interface GeoJSON {
  /**
   * Compute a GeoJSON-formatted string from geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  geojson: Arg1;
}

/* An argmax aggregate transform. */
export interface Argmax extends AggregateOptions, WindowOptions {
  /**
   * Find a value of the first column that maximizes the second column.
   */
  argmax: Arg2;
}

/* An argmin aggregate transform. */
export interface Argmin extends AggregateOptions, WindowOptions {
  /**
   * Find a value of the first column that minimizes the second column.
   */
  argmin: Arg2;
}

/* An avg (average, or mean) aggregate transform. */
export interface Avg extends AggregateOptions, WindowOptions {
  /**
   * Compute the average (mean) value of the given column.
   */
  avg: Arg1;
}

/* A count aggregate transform. */
export interface Count extends AggregateOptions, WindowOptions {
  /**
   * Compute the count of records in an aggregation group.
   */
  count: Arg0 | Arg1;
}

/* A first aggregate transform. */
export interface First extends AggregateOptions, WindowOptions {
  /**
   * Return the first column value found in an aggregation group.
   */
  first: Arg1;
}

/* A last aggregate transform. */
export interface Last extends AggregateOptions, WindowOptions {
  /**
   * Return the last column value found in an aggregation group.
   */
  last: Arg1;
}

/* A max aggregate transform. */
export interface Max extends AggregateOptions, WindowOptions {
  /**
   * Compute the maximum value of the given column.
   */
  max: Arg1;
}

/* A min aggregate transform. */
export interface Min extends AggregateOptions, WindowOptions {
  /**
   * Compute the minimum value of the given column.
   */
  min: Arg1;
}

/* A median aggregate transform. */
export interface Median extends AggregateOptions, WindowOptions {
  /**
   * Compute the median value of the given column.
   */
  median: Arg1;
}

/* A mode aggregate transform. */
export interface Mode extends AggregateOptions, WindowOptions {
  /**
   * Compute the mode value of the given column.
   */
  mode: Arg1;
}

/* A product aggregate transform. */
export interface Product extends AggregateOptions, WindowOptions {
  /**
   * Compute the product of the given column.
   */
  product: Arg1;
}

/* A quantile aggregate transform. */
export interface Quantile extends AggregateOptions, WindowOptions {
  /**
   * Compute the quantile value of the given column at the provided
   * probability threshold. For example, 0.5 is the median.
   */
  quantile: Arg2;
}

/* A sum aggregate transform. */
export interface Sum extends AggregateOptions, WindowOptions {
  /**
   * Compute the sum of the given column.
   */
  sum: Arg1;
}

/* A row_number window transform. */
export interface RowNumber extends WindowOptions {
  /**
   * Compute the 1-based row number over an ordered window partition.
   */
  row_number: Arg0;
}

/* A rank window transform. */
export interface Rank extends WindowOptions {
  /**
   * Compute the row rank over an ordered window partition.
   * Sorting ties result in gaps in the rank numbers ([1, 1, 3, ...]).
   */
  rank: Arg0;
}

/* A dense_rank window transform. */
export interface DenseRank extends WindowOptions {
  /**
   * Compute the dense row rank (no gaps) over an ordered window partition.
   * Sorting ties do not result in gaps in the rank numbers ( [1, 1, 2, ...]).
   */
  dense_rank: Arg0;
}

/* A percent_rank window transform. */
export interface PercentRank extends WindowOptions {
  /**
   * Compute the percetange rank over an ordered window partition.
   */
  percent_rank: Arg0;
}

/* A cume_dist window transform. */
export interface CumeDist extends WindowOptions {
  /**
   * Compute the cumulative distribution value over an ordered window
   * partition. Equals the number of partition rows preceding or peer with
   * the current row, divided by the total number of partition rows.
   */
  cume_dist: Arg0;
}

/* An ntile window transform. */
export interface NTile extends WindowOptions {
  /**
   * Compute an n-tile integer ranging from 1 to the provided argument
   * (num_buckets), dividing the partition as equally as possible.
   */
  ntile: Arg1;
}

/* A lag window transform. */
export interface Lag extends WindowOptions {
  /**
   * Compute lagging values in a column. Returns the value at the row that is
   * `offset` (second argument, default `1`) rows before the current row within
   * the window frame. If there is no such row, instead return `default` (third
   * argument, default `null`). Both offset and default are evaluated with
   * respect to the current row.
   */
  lag: Arg3Opt;
}

/* A lead window transform. */
export interface Lead extends WindowOptions {
  /**
   * Compute leading values in a column. Returns the value at the row that is
   * `offset` (second argument, default `1`) rows after the current row within
   * the window frame. If there is no such row, instead return `default` (third
   * argument, default `null`). Both offset and default are evaluated with
   * respect to the current row.
   */
  lag: Arg3Opt;
}

/* A first_value window transform. */
export interface FirstValue extends WindowOptions {
  /**
   * Get the first value of the given column in the current window frame.
   */
  first_value: Arg1;
}

/* A last_value window transform. */
export interface LastValue extends WindowOptions {
  /**
   * Get the last value of the given column in the current window frame.
   */
  last_value: Arg1;
}

/* An nth_value window transform. */
export interface NthValue extends WindowOptions {
  /**
   * Get the nth value of the given column in the current window frame,
   * counting from one. The second argument is the offset for the nth row.
   */
  nth_value: Arg2Opt;
}

/** A data transform that maps one column value to another. */
export type ColumnTransform =
  | Bin
  | DateMonth
  | DateMonthDay
  | DateDay
  | Centroid
  | CentroidX
  | CentroidY
  | GeoJSON;

/** An aggregate transform that combines multiple values. */
export type AggregateTransform =
  | Argmax
  | Argmin
  | Avg
  | Count
  | Max
  | Min
  | First
  | Last
  | Max
  | Min
  | Median
  | Mode
  | Product
  | Quantile
  | Sum;

/* A window transform that operates over a sorted domain. */
export type WindowTransform =
  | RowNumber
  | Rank
  | DenseRank
  | PercentRank
  | CumeDist
  | NTile
  | Rank
  | Lag
  | Lead
  | FirstValue
  | LastValue
  | NthValue;

/** A data transform. */
export type Transform =
  | ColumnTransform
  | AggregateTransform
  | WindowTransform;
