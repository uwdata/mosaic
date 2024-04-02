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

/** Specification metadata. */
export interface SpecMeta extends Record<string, any> {
  /** The specification title. */
  title?: string;
  /** A description of the specification content.  */
  description?: string;
  /** Credits or other acknowledgements. */
  credit?: string;
}

/** Configuration options. */
export interface SpecConfig extends Record<string, any> {
  extensions?: string | string[];
}

/** Top-level dataset definitions. */
export interface SpecData {
  /** A dataset name and definition. */
  [name: string]: SpecDataDefinition;
}

/** Top-level Param and Selection definitions. */
export interface SpecData {
  /** A parameter name and the Param or Selection definition. */
  [name: string]: SpecParamDefinition;
}

/** A specifcation component such as a plot, input widget, or layout. */
export type SpecComponent =
  | SpecHConcatNode
  | SpecVConcatNode
  | SpecHSpace
  | SpecVSpace
  | SpecInput
  | SpecPlot
  | SpecPlotMark
  | SpecLegend;

/** A declarative Mosaic specification. */
export type Spec = {
  /** Specification metadata. */
  meta?: SpecMeta;
  /** Configuration options. */
  config?: SpecConfig;
  /** Dataset definitions. */
  data?: SpecData;
  /** Param and Selection definitions. */
  params?: SpecParams;
  /** A default set of attributes to apply to all plot components. */
  plotDefaults?: SpecPlotAttributes;
} & SpecComponent;
