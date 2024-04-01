import { SpecDataDefinition } from './DataNode.js';
import { SpecParamDefinition } from './ParamNode.js';
import { SpecHConcatNode } from './HConcatNode.js';
import { SpecVConcatNode } from './VConcatNode.js';
import { SpecHSpace } from './HSpaceNode.js';
import { SpecVSpace } from './VSpaceNode.js';
import { SpecInput } from './InputNode.js';
import { SpecPlot } from './PlotNode.js';
import { SpecPlotMark } from './PlotMarkNode.js';
import { SpecLegend } from './PlotLegendNode.js';
import { SpecPlotAttributes } from './PlotAttributeNode.js';
import { DataNode } from './DataNode.js';
import { ParamNode } from './ParamNode.js';
import { SelectionNode } from './SelectionNode.js';
import { PlotAttributeNode } from './PlotAttributeNode.js';
import { InputNode } from './InputNode.js';
import { HConcatNode } from './HConcatNode.js';
import { VConcatNode } from './VConcatNode.js';
import { HSpaceNode } from './HSpaceNode.js';
import { VSpaceNode } from './VSpaceNode.js';
import { PlotNode } from './PlotNode.js';
import { PlotMarkNode } from './PlotMarkNode.js';
import { PlotLegendNode } from './PlotLegendNode.js';

export type Spec = {
  meta?: SpecMeta;
  config?: SpecConfig;
  data?: SpecData;
  params?: SpecParams;
  plotDefaults?: SpecPlotAttributes;
} & SpecComponent;

export type SpecMeta = {
  title?: string;
  description?: string;
  credit?: string;
} & Record<string, any>;

export type SpecConfig = {
  extensions?: string | string[];
} & Record<string, any>;

export type SpecData = Record<string, SpecDataDefinition>;

export type SpecParams = Record<string, SpecParamDefinition>;

export type SpecComponent =
  | SpecHConcatNode
  | SpecVConcatNode
  | SpecHSpace
  | SpecVSpace
  | SpecInput
  | SpecPlot
  | SpecPlotMark
  | SpecLegend;
