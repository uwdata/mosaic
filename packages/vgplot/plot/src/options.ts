import type * as mc from '@uwdata/mosaic-core';

export interface LegendOptions {
  as?: mc.Selection;
  field?: string;
  label?: string;
  tickSize?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  width?: number;
  height?: number;
  columns?: number;
}