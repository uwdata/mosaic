import { ParamRef } from '../Param.js';

/** A highlight interactor. */
export interface Highlight {
  /**
   * Highlight selected marks by deemphasizing the others.
   */
  select: 'highlight';
  /**
   * The input selection. Unselected marks are deemphasized.
   */
  by: ParamRef;
  /**
   * The overall opacity of deemphasized marks.
   * By default the opacity is set to 0.2.
   */
  opacity?: number;
  /**
   * The fill opacity of deemphasized marks.
   * By default the fill opacity is unchanged.
   */
  fillOpacity?: number;
  /**
   * The stroke opacity of deemphasized marks.
   * By default the stroke opacity is unchanged.
   */
  strokeOpacity?: number;
  /**
   * The fill color of deemphasized marks.
   * By default the fill is unchanged.
   */
  fill?: string;
  /**
   * The stroke color of deemphasized marks.
   * By default the stroke is unchanged.
   */
  stroke?: string;
}
