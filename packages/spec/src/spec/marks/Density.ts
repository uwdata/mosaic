import { ParamRef } from '../Param.js';
import { AreaXOptions, AreaYOptions } from './Area.js';
import { DotOptions } from './Dot.js';
import { LineXOptions, LineYOptions } from './Line.js';
import { MarkData, MarkOptions, TextStyles } from './Marks.js';
import { Grid2DOptions } from './Raster.js';
import { TextOptions } from './Text.js';

// Density2D

export interface Density2DOptions extends MarkOptions, Omit<DotOptions, 'x' | 'y'>, TextStyles, Grid2DOptions {
  /**
   * The basic mark type to use to render 2D density values.
   * Defaults to a dot mark; cell and text marks are also supported.
   */
  type?: 'dot' | 'circle' | 'hexagon' | 'cell' | 'text' | ParamRef;
}

/** The density mark for 2D densities. */
export interface Density extends MarkData, Density2DOptions {
  /**
   * A 2D density mark that shows smoothed point cloud densities along two
   * dimensions. The mark bins the data, counts the number of records that fall
   * into each bin, and smooths the resulting counts, then plots the smoothed
   * distribution, by default using a circular dot mark. The density mark
   * calculates density values that can be mapped to encoding channels such as
   * fill or r using the special field name "density".
   *
   * Set the *type* property to use a different base mark type.
   */
  mark: 'density';
}

// Density1D

export interface Density1DOptions {
  /**
   * The kernel density bandwidth for smoothing, in pixels. Defaults to 20.
   */
  bandwidth?: number | ParamRef;

  /**
   * The number of bins over which to discretize the data prior to smoothing.
   * Defaults to 1024.
   */
  bins?: number | ParamRef;

  /**
   * Normalization method for density estimates. If `false` or `'none'` (the
   * default), the density estimates are smoothed weighted counts. If `true`
   * or `'sum'`, density estimates are divided by the sum of the total point
   * mass. If `'max'`, estimates are divided by the maximum smoothed value.
   */
  normalize?: boolean | 'max' | 'sum' | 'none' | ParamRef;
}

export interface DensityAreaXOptions extends Omit<AreaXOptions, 'x' | 'x1' | 'x2'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaX mark; lineX, dotX, and textX marks are also supported.
   */
  type: 'areaX';

  /**
   * Flag indicating if densities should be stacked. Defaults to false.
   */
  stack?: boolean | ParamRef;
}

export interface DensityAreaYOptions extends Omit<AreaYOptions, 'y' | 'y1' | 'y2'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaY mark; lineY, dot, and text marks are also supported.
   */
  type?: 'areaY';

  /**
   * Flag indicating if densities should be stacked. Defaults to false.
   */
  stack?: boolean | ParamRef;
}

export interface DensityLineXOptions extends Omit<LineXOptions, 'x' | 'x1' | 'x2'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaX mark; lineX, dotX, and textX marks are also supported.
   */
  type: 'lineX';
}

export interface DensityLineYOptions extends Omit<LineYOptions, 'y' | 'y1' | 'y2'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaY mark; lineY, dot, and text marks are also supported.
   */
  type: 'lineY';
}

export interface DensityDotXOptions extends Omit<DotOptions, 'x'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaX mark; lineX, dotX, and textX marks are also supported.
   */
  type: 'dotX';
}

export interface DensityDotYOptions extends Omit<DotOptions, 'y'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaY mark; lineY, dot, and text marks are also supported.
   */
  type: 'dot' | 'dotY' | 'circle' | 'hexagon';
}

export interface DensityTextXOptions extends Omit<TextOptions, 'x'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaX mark; lineX, dotX, and textX marks are also supported.
   */
  type: 'textX';
}

export interface DensityTextYOptions extends Omit<TextOptions, 'y'> {
  /**
   * The basic mark type to use to render 1D density values. Defaults to an
   * areaY mark; lineY, dot, and text marks are also supported.
   */
  type: 'text' | 'textY';
}

export interface DensityXBase extends MarkData, Density1DOptions {
  /**
   * A densityX mark that visualizes smoothed point cloud densities along the
   * **x** dimension. The mark bins the data, counts the number of records that
   * fall into each bin, smooths the resulting counts, and then plots the
   * smoothed distribution, by default using an areaX mark.
   *
   * Set the *type* property to use a different base mark type.
   */
  mark: 'densityX';
}

export interface DensityYBase extends MarkData, Density1DOptions {
  /**
   * A densityY mark that visualizes smoothed point cloud densities along the
   * **y** dimension. The mark bins the data, counts the number of records that
   * fall into each bin, smooths the resulting counts, and then plots the
   * smoothed distribution, by default using an areaY mark.
   *
   * Set the *type* property to use a different base mark type.
   */
  mark: 'densityY';
}

/** The densityX mark. */
export type DensityX = DensityXBase & (
  DensityAreaXOptions | DensityLineXOptions | DensityDotXOptions | DensityTextXOptions
);

/** The densityY mark. */
export type DensityY = DensityYBase & (
  DensityAreaYOptions | DensityLineYOptions | DensityDotYOptions | DensityTextYOptions
);
