import { ParamRef } from '../Param.js';
import { MarkOptions } from './Marks.js';

/** Options for the hexgrid mark. */
export interface HexgridOptions extends MarkOptions {
  /**
   * The distance between centers of neighboring hexagons, in pixels; defaults
   * to 20. Should match the **binWidth** of the hexbin mark.
   */
  binWidth?: number | ParamRef;
}

/** The hexgrid mark. */
export interface Hexgrid extends HexgridOptions {
  /**
   * The hexgrid decoration mark complements the hexbin mark, showing the
   * outlines of all hexagons spanning the frame with a default **stroke** of
   * *currentColor* and a default **strokeOpacity** of 0.1, similar to the
   * default axis grids.
   *
   * Note that the **binWidth** option of the hexgrid mark should match that of
   * the hexbin transform. The grid is clipped by the frame. This is a
   * stroke-only mark, and **fill** is not supported; to fill the frame,
   * use the frame mark.
   */
  mark: 'hexgrid';
}
