import { SpecPlotAttributes } from './PlotAttributeNode.js';
import { SpecPlotInteractor } from './PlotInteractorNode.js';
import { SpecPlotLegend } from './PlotLegendNode.js';
import { SpecPlotMark } from './PlotMarkNode.js';

export type SpecPlot = {
  plot: SpecPlotEntry[]
} & SpecPlotAttributes;

export type SpecPlotEntry =
  | SpecPlotMark
  | SpecPlotInteractor
  | SpecPlotLegend;