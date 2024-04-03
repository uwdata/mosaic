import { ParamRef } from './Param.js';

export type TransformField =
  | string
  | ParamRef;

export interface WindowOptions {
  orderby?: TransformField | TransformField[];
  partitionby?: TransformField | TransformField[];
  rows?: ParamRef | (number | null)[];
  range?: ParamRef | (number | null)[];
}

export interface AggregateOptions {
  distinct?: boolean;
}

type Arg = string | number | boolean;
type Arg0 = null | [];
type Arg1 = Arg | [Arg];
type Arg2 = [Arg, Arg];
type Arg2Opt = Arg | [Arg, Arg?];
type Arg3Opt = Arg | [Arg, Arg?, Arg?];

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

export interface Bin {
  /**
   * Bin a continuous variable into discrete intervals. This transform accepts
   * a data column to bin over as well as an optional bin options object.
   */
  bin: Arg | [Arg] | [Arg, BinOptions];
}

export interface DateMonth {
  /**
   * Transform a Date value to a month boundary for cyclic comparison.
   * Year values are collapsed to enable comparison over months only.
   */
  dateMonth: Arg1;
}

export interface DateMonthDay {
  /**
   * Transform a Date value to a month and day boundary for cyclic comparison.
   * Year values are collapsed to enable comparison over months and days only.
   */
  dateMonthDay: Arg1;
}

export interface DateDay {
  /**
   * Transform a Date value to a day of the month for cyclic comparison.
   * Year and month values are collapsed to enable comparison over days only.
   */
  dateDay: Arg1;
}

export interface Centroid {
  /**
   * Compute the 2D centroid of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroid: Arg1;
}

export interface CentroidX {
  /**
   * Compute the centroid x-coordinate of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroidX: Arg1;
}

export interface CentroidY {
  /**
   * Compute the centroid y-coordinate of geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  centroidY: Arg1;
}

export interface GeoJSON {
  /**
   * Compute a GeoJSON-formatted string from geometry-typed data.
   * This transform requires the DuckDB `spatial` extension.
   */
  geojson: Arg1;
}

export interface Argmax extends AggregateOptions, WindowOptions {
  /**
   * Find a value of the first column that maximizes the second column.
   */
  argmax: Arg2;
}

export interface Argmin extends AggregateOptions, WindowOptions {
  /**
   * Find a value of the first column that minimizes the second column.
   */
  argmin: Arg2;
}

export interface Avg extends AggregateOptions, WindowOptions {
  /**
   * Compute the average (mean) value of the given column.
   */
  avg: Arg1;
}

export interface Count extends AggregateOptions, WindowOptions {
  /**
   * Compute the count of records in an aggregation group.
   */
  count: Arg0 | Arg1;
}

export interface First extends AggregateOptions, WindowOptions {
  /**
   * Return the first column value found in an aggregation group.
   */
  first: Arg1;
}

export interface Last extends AggregateOptions, WindowOptions {
  /**
   * Return the last column value found in an aggregation group.
   */
  last: Arg1;
}

export interface Max extends AggregateOptions, WindowOptions {
  /**
   * Compute the maximum value of the given column.
   */
  max: Arg1;
}

export interface Min extends AggregateOptions, WindowOptions {
  /**
   * Compute the minimum value of the given column.
   */
  min: Arg1;
}

export interface Median extends AggregateOptions, WindowOptions {
  /**
   * Compute the median value of the given column.
   */
  median: Arg1;
}

export interface Mode extends AggregateOptions, WindowOptions {
  /**
   * Compute the mode value of the given column.
   */
  mode: Arg1;
}

export interface Product extends AggregateOptions, WindowOptions {
  /**
   * Compute the product of the given column.
   */
  product: Arg1;
}

export interface Quantile extends AggregateOptions, WindowOptions {
  /**
   * Compute the quantile value of the given column at the provided
   * probability threshold. For example, 0.5 is the median.
   */
  quantile: Arg2;
}

export interface Sum extends AggregateOptions, WindowOptions {
  /**
   * Compute the sum of the given column.
   */
  sum: Arg1;
}

export interface RowNumber extends WindowOptions {
  /**
   * Compute the 1-based row number over an ordered window partition.
   */
  row_number: Arg0;
}

export interface Rank extends WindowOptions {
  /**
   * Compute the row rank over an ordered window partition.
   * Sorting ties result in gaps in the rank numbers ([1, 1, 3, ...]).
   */
  rank: Arg0;
}

export interface DenseRank extends WindowOptions {
  /**
   * Compute the dense row rank (no gaps) over an ordered window partition.
   * Sorting ties do not result in gaps in the rank numbers ( [1, 1, 2, ...]).
   */
  dense_rank: Arg0;
}

export interface PercentRank extends WindowOptions {
  /**
   * Compute the percetange rank over an ordered window partition.
   */
  percent_rank: Arg0;
}

export interface CumeDist extends WindowOptions {
  /**
   * Compute the cumulative distribution value over an ordered window
   * partition. Equals the number of partition rows preceding or peer with
   * the current row, divided by the total number of partition rows.
   */
  cume_dist: Arg0;
}

export interface NTile extends WindowOptions {
  /**
   * Compute an n-tile integer ranging from 1 to the provided argument
   * (num_buckets), dividing the partition as equally as possible.
   */
  ntile: Arg1;
}

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

export interface FirstValue extends WindowOptions {
  /**
   * Get the first value of the given column in the current window frame.
   */
  first_value: Arg1;
}

export interface LastValue extends WindowOptions {
  /**
   * Get the last value of the given column in the current window frame.
   */
  last_value: Arg1;
}

export interface NthValue extends WindowOptions {
  /**
   * Get the nth value of the given column in the current window frame,
   * counting from one. The second argument is the offset for the nth row.
   */
  nth_value: Arg2Opt;
}

export type Transform =
  | Bin
  | DateMonth
  | DateMonthDay
  | DateDay
  | Centroid
  | CentroidX
  | CentroidY
  | GeoJSON
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
  | Sum
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
