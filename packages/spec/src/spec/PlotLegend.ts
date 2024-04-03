import { ParamRef } from './Param.js';

/**
 * A legend defined as an entry within a plot.
 */
export interface PlotLegend {
  /**
   * A legend of the given type.
   * The valid types are `"color"`, `"opacity"`, and `"symbol"`.
   */
  legend: 'color' | 'opacity' | 'symbol';
  /**
   * The output selection. If specified, the legend is interactive, using a
   * `toggle` interaction for discrete legends or an `intervalX` interaction
   * for continuous legends.
   */
  as?: ParamRef;
  /**
   * The data field over which to generate output selection clauses. If
   * unspecified, a matching field is retrieved from existing plot marks.
   */
  field?: string;
  /**
   * The legend label.
   */
  label?: string;
  /**
   * The size of legend ticks in a continuous legend, in pixels.
   */
  tickSize?: number;
  /**
   * The top margin of the legend component, in pixels.
   */
  marginTop?: number;
  /**
   * The right margin of the legend component, in pixels.
   */
  marginRight?: number;
  /**
   * The bottom margin of the legend component, in pixels.
   */
  marginBottom?: number;
  /**
   * The left margin of the legend component, in pixels.
   */
  marginLeft?: number;
  /**
   * The width of a continuous legend, in pixels.
   */
  width?: number;
  /**
   * The height of a continuous legend, in pixels.
   */
  height?: number;
  /**
   * The number of columns to use to layout a discrete legend.
   */
  columns?: number;
}

/**
 * A legend defined as a top-level spec component.
 */
export interface Legend extends PlotLegend {
  /**
   * The name of the plot this legend applies to.
   * A plot must include a `name` attribute to be referenced.
   */
  for: string;
}
