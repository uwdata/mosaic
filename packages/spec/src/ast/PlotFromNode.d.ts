import { SpecParamRef } from './ParamRefNode.js';

export type SpecPlotMarkData =
  | SpecPlotDataInline
  | SpecPlotFrom;

export type SpecPlotDataInline = any[];

export type SpecPlotFrom = {
  from: string;
  filterBy?: SpecParamRef;
} & {
  [key: string]: any
};
