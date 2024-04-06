import { ParamRef } from '../Param.js';
import { ChannelValue, MarkData } from './Marks.js';
import { RasterOptions } from './Raster.js';

export interface DenseLineOptions extends RasterOptions {
  /**
   * Flag to perform approximate arc length normalization of line segments
   * to prevent artifacts due to overcounting steep lines. Defaults to `true`.
   */
  normalize?: boolean | ParamRef;

  /**
   * A ordinal channel for grouping data into series to be drawn as separate
   * lines.
   */
  z?: ChannelValue;
}

/** The denseLine mark. */
export interface DenseLine extends MarkData, DenseLineOptions {
  /**
   * A denseLine mark that plots line densities rather than point densities.
   * The mark forms a binned raster grid and "draws" straight lines into it.
   * To avoid over-weighting steep lines, by default each drawn series is
   * normalized on a per-column basis to approximate arc length normalization.
   * The values for each series are aggregated to form the line density, which
   * is then drawn as an image similar to the raster mark.
   */
  mark: 'denseLine';
}
