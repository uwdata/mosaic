import { SpecParamRef } from './ParamRefNode.js';

export type SpecTransformField =
  | string
  | SpecParamRef;

export interface SpecWindowOptions {
  orderby?: SpecTransformField | SpecTransformField[];
  partitionby?: SpecTransformField | SpecTransformField[];
  rows?: SpecParamRef | (number | null)[];
  range?: SpecParamRef | (number | null)[];
}

export interface SpecAggregateOptions {
  distinct?: boolean;
}

export type SpecTransformArgument =
  | string
  | number
  | boolean;

export interface SpecBinTransform {
  bin: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecDateMonthTransform {
  dateMonth: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecDateMonthDayTransform {
  dateMonthDay: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecDateDayTransform {
  dateDay: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecCentroidTransform {
  centroid: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecCentroidXTransform {
  centroidX: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecCentroidYTransform {
  centroidY: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecGeoJSONTransform {
  geojson: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecArgmaxTransform extends SpecAggregateOptions, SpecWindowOptions {
  argmax: [SpecTransfromArgument, SpecTransfromArgument];
}

export interface SpecArgminTransform extends SpecAggregateOptions, SpecWindowOptions {
  argmin: [SpecTransfromArgument, SpecTransfromArgument];
}

export interface SpecAvgTransform extends SpecAggregateOptions, SpecWindowOptions {
  avg: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecCountTransform extends SpecAggregateOptions, SpecWindowOptions {
  count: [];
}

export interface SpecFirstTransform extends SpecAggregateOptions, SpecWindowOptions {
  first: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecLastTransform extends SpecAggregateOptions, SpecWindowOptions {
  last: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecMaxTransform extends SpecAggregateOptions, SpecWindowOptions {
  max: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecMinTransform extends SpecAggregateOptions, SpecWindowOptions {
  min: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecMedianTransform extends SpecAggregateOptions, SpecWindowOptions {
  median: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecModeTransform extends SpecAggregateOptions, SpecWindowOptions {
  mode: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecProductTransform extends SpecAggregateOptions, SpecWindowOptions {
  product: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecQuantileTransform extends SpecAggregateOptions, SpecWindowOptions {
  quantile: [SpecTransfromArgument, SpecTransfromArgument];
}

export interface SpecSumTransform extends SpecAggregateOptions, SpecWindowOptions {
  sum: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecRowNumberTransform extends SpecWindowOptions {
  row_number: [];
}

export interface SpecRankTransform extends SpecWindowOptions {
  rank: [];
}

export interface SpecDenseRankTransform extends SpecWindowOptions {
  dense_rank: [];
}

export interface SpecPercentRankTransform extends SpecWindowOptions {
  percent_rank: [];
}

export interface SpecCumeDistTransform extends SpecWindowOptions {
  cume_dist: [];
}

export interface SpecNTileTransform extends SpecWindowOptions {
  ntile: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecRankTransform extends SpecWindowOptions {
  rank: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecLagTransform extends SpecWindowOptions {
  lag: SpecTransfromArgument | [SpecTransfromArgument, SpecTransfromArgument?, SpecTransfromArgument?];
}

export interface SpecLeadTransform extends SpecWindowOptions {
  lag: SpecTransfromArgument | [SpecTransfromArgument, SpecTransfromArgument?, SpecTransfromArgument?];
}

export interface SpecFirstValueTransform extends SpecWindowOptions {
  first_value: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecLastValueTransform extends SpecWindowOptions {
  last_value: SpecTransfromArgument | [SpecTransfromArgument];
}

export interface SpecNthValueTransform extends SpecWindowOptions {
  nth_value: SpecTransfromArgument | [SpecTransfromArgument, SpecTransfromArgument?];
}

export type SpecTransform =
  | SpecBinTransform
  | SpecDateMonthTransform
  | SpecDateMonthDayTransform
  | SpecDateDayTransform
  | SpecCentroidTransform
  | SpecCentroidXTransform
  | SpecCentroidYTransform
  | SpecGeoJSONTransform
  | SpecArgmaxTransform
  | SpecArgminTransform
  | SpecAvgTransform
  | SpecCountTransform
  | SpecMaxTransform
  | SpecMinTransform
  | SpecFirstTransform
  | SpecLastTransform
  | SpecMaxTransform
  | SpecMinTransform
  | SpecMedianTransform
  | SpecModeTransform
  | SpecProductTransform
  | SpecQuantileTransform
  | SpecSumTransform
  | SpecRowNumberTransform
  | SpecRowNumberTransform
  | SpecRankTransform
  | SpecDenseRankTransform
  | SpecPercentRankTransform
  | SpecCumeDistTransform
  | SpecNTileTransform
  | SpecRankTransform
  | SpecLagTransform
  | SpecLeadTransform
  | SpecFirstValueTransform
  | SpecLastValueTransform
  | SpecNthValueTransform;
