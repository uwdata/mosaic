import { ParamRef } from './Param.js';

export interface PlotLegend {
  legend: 'color' | 'opacity' | 'symbol';
  as?: ParamRef;
  field?: string;
  tickSize?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  width?: number;
  height?: number;
  columns?: number;
}

export interface Legend extends PlotLegend {
  for: string;
}
