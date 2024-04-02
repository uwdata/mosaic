import { SpecPlotAttributes } from './PlotAttributeNode.js';
import { SpecPlotInteractor } from './PlotInteractorNode.js';
import { SpecPlotLegend } from './PlotLegendNode.js';
import { SpecPlotMark } from './PlotMarkNode.js';

export type SpecPlotEntry =
  | SpecPlotInteractor
  | SpecPlotLegend
  | SpecPlotMark;

export interface SpecPlot extends SpecPlotAttributes {
  /**
   * An array of plot marks, interactors, or legends.
   * Marks are graphical elements that make up plot layers.
   * Unless otherwise configured, interactors will use the nearest
   * previous mark as a basis for which data fields to select.
   */
  plot: SpecPlotEntry[];
}
