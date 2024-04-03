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

type TransformArgument = string | number | boolean;
type Arg1 = TransformArgument | [TransformArgument];
type Arg2 = [TransformArgument, TransformArgument];
type Arg2Opt = TransformArgument | [TransformArgument, TransformArgument?];
type Arg3Opt = TransformArgument | [TransformArgument, TransformArgument?, TransformArgument?];

export interface Bin {
  bin: Arg1;
}

export interface DateMonth {
  dateMonth: Arg1;
}

export interface DateMonthDay {
  dateMonthDay: Arg1;
}

export interface DateDay {
  dateDay: Arg1;
}

export interface Centroid {
  centroid: Arg1;
}

export interface CentroidX {
  centroidX: Arg1;
}

export interface CentroidY {
  centroidY: Arg1;
}

export interface GeoJSON {
  geojson: Arg1;
}

export interface Argmax extends AggregateOptions, WindowOptions {
  argmax: Arg2;
}

export interface Argmin extends AggregateOptions, WindowOptions {
  argmin: Arg2;
}

export interface Avg extends AggregateOptions, WindowOptions {
  avg: Arg1;
}

export interface Count extends AggregateOptions, WindowOptions {
  count: [] | Arg1;
}

export interface First extends AggregateOptions, WindowOptions {
  first: Arg1;
}

export interface Last extends AggregateOptions, WindowOptions {
  last: Arg1;
}

export interface Max extends AggregateOptions, WindowOptions {
  max: Arg1;
}

export interface Min extends AggregateOptions, WindowOptions {
  min: Arg1;
}

export interface Median extends AggregateOptions, WindowOptions {
  median: Arg1;
}

export interface Mode extends AggregateOptions, WindowOptions {
  mode: Arg1;
}

export interface Product extends AggregateOptions, WindowOptions {
  product: Arg1;
}

export interface Quantile extends AggregateOptions, WindowOptions {
  quantile: Arg2;
}

export interface Sum extends AggregateOptions, WindowOptions {
  sum: Arg1;
}

export interface RowNumber extends WindowOptions {
  row_number: [];
}

export interface Rank extends WindowOptions {
  rank: [];
}

export interface DenseRank extends WindowOptions {
  dense_rank: [];
}

export interface PercentRank extends WindowOptions {
  percent_rank: [];
}

export interface CumeDist extends WindowOptions {
  cume_dist: [];
}

export interface NTile extends WindowOptions {
  ntile: Arg1;
}

export interface Lag extends WindowOptions {
  lag: Arg3Opt;
}

export interface Lead extends WindowOptions {
  lag: Arg3Opt;
}

export interface FirstValue extends WindowOptions {
  first_value: Arg1;
}

export interface LastValue extends WindowOptions {
  last_value: Arg1;
}

export interface NthValue extends WindowOptions {
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
