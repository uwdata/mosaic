import { SpecParamRef } from './ParamNode.js';

export const LegendType = 'color' | 'opacity' | 'symbol';

export type SpecPlotLegend = {
  legend: LegendType;
  as?: SpecParamRef;
  field?: string;
} & {
  // todo: legend options
  [key: string]: any
};

export type SpecLegend =
  & SpecPlotLegend
  & { for: string };
