import { SpecParamRef } from './ParamNode.js';

export type LegendType =
  | 'color'
  | 'opacity'
  | 'symbol';

export interface SpecPlotLegend {
  legend: LegendType;
  as?: SpecParamRef;
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

export interface SpecLegend extends SpecPlotLegend {
  for: string;
}
