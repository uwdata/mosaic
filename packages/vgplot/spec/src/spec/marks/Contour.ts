import { ParamRef } from '../Param.js';
import { MarkData, MarkOptions } from './Marks.js';
import { Grid2DOptions } from './Raster.js';

export interface ContourOptions extends MarkOptions, Grid2DOptions {
  /**
   * The number of contour thresholds to subdivide the domain into discrete
   * level sets; defaults to 10. One of:
   *
   * - a count representing the desired number of bins
   * - an array of *n* threshold values for *n* - 1 bins
   */
  thresholds?: number | number[] | ParamRef;
}

/** The contour mark. */
export interface Contour extends MarkData, ContourOptions {
  /**
   * A contour mark that draws isolines to delineate regions above and below a
   * particular continuous value. It is often used to convey densities as a
   * height field. The special column name "density" can be used to map density
   * values to the fill or stroke options.
   */
  mark: 'contour';
}
