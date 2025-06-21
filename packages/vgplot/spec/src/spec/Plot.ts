import { PlotAttributes } from './PlotAttribute.js';
import { PlotInteractor } from './PlotInteractor.js';
import { PlotLegend } from './PlotLegend.js';
import { PlotMark } from './PlotMark.js';

/** A plot component. */
export interface Plot extends PlotAttributes {
  /**
   * An array of plot marks, interactors, or legends.
   * Marks are graphical elements that make up plot layers.
   * Unless otherwise configured, interactors will use the nearest
   * previous mark as a basis for which data fields to select.
   */
  plot: (PlotMark | PlotInteractor | PlotLegend)[];
}
