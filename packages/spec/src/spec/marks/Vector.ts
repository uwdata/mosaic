import { ParamRef } from '../Param.js';
import { FrameAnchor } from '../PlotTypes.js';
import { ChannelValue, ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/**
 * The built-in vector shape implementations; one of:
 *
 * - *arrow* - a straight line with an open arrowhead at the end (↑)
 * - *spike* - an isosceles triangle with a flat base (▲)
 */
export type VectorShapeName = 'arrow' | 'spike';

/** How to draw a vector: either a named shape or a custom implementation. */
export type VectorShape = VectorShapeName;

/** Options for the vector mark. */
export interface VectorOptions extends MarkData, MarkOptions {
  /**
   * The horizontal position of the vector’s anchor point; an optional channel
   * bound to the *x* scale. Default depends on the **frameAnchor**.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position of the vector’s anchor point; an optional channel
   * bound to the *y* scale. Default depends on the **frameAnchor**.
   */
  y?: ChannelValueSpec;

  /**
   * The vector shape’s radius, such as half the width of the *arrow*’s head or
   * the *spike*’s base; a constant number in pixels. Defaults to 3.5 pixels.
   */
  r?: number | ParamRef;

  /**
   * The vector’s length; either an optional channel bound to the *length* scale
   * or a constant number in pixels. Defaults to 12 pixels.
   */
  length?: ChannelValueSpec;

  /**
   * The vector’s orientation (rotation angle); either a constant number in
   * degrees clockwise, or an optional channel (with no associated scale).
   * Defaults to 0 degrees with the vector pointing up.
   */
  rotate?: ChannelValue;

  /** The shape of the vector; a constant. Defaults to *arrow*. */
  shape?: VectorShape | ParamRef;

  /**
   * The vector’s position along its orientation relative to its anchor point; a
   * constant. Assuming a default **rotate** angle of 0°, one of:
   *
   * - *start* - from [*x*, *y*] to [*x*, *y* - *l*]
   * - *middle* (default) - from [*x*, *y* + *l* / 2] to [*x*, *y* - *l* / 2]
   * - *end* - from [*x*, *y* + *l*] to [*x*, *y*]
   *
   * where [*x*, *y*] is the vector’s anchor point and *l* is the vector’s
   * (possibly scaled) length in pixels.
   */
  anchor?: 'start' | 'middle' | 'end' | ParamRef;

  /**
   * The vector’s frame anchor, to default **x** and **y** relative to the
   * frame; a constant representing one of the frame corners (*top-left*,
   * *top-right*, *bottom-right*, *bottom-left*), sides (*top*, *right*,
   * *bottom*, *left*), or *middle* (default). Has no effect if both **x**
   * and **y** are specified.
   */
  frameAnchor?: FrameAnchor | ParamRef;
}

export interface Vector extends VectorOptions {
  /**
   * A vector mark.
   *
   * If none of **frameAnchor**, **x**, and **y** are specified, then **x** and
   * **y** default to accessors assuming that *data* contains tuples [[*x₀*,
   * *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …]
   */
  mark: 'vector';
}

export interface VectorX extends VectorOptions {
  /**
   * Like vector, but **x** instead defaults to the identity function and **y**
   * defaults to null, assuming that *data* is an array of numbers [*x₀*, *x₁*,
   * *x₂*, …].
   */
  mark: 'vectorX';
}

export interface VectorY extends VectorOptions {
  /**
   * Like vector, but **y** instead defaults to the identity function and **x**
   * defaults to null, assuming that *data* is an array of numbers [*y₀*, *y₁*,
   * *y₂*, …].
   */
  mark: 'vectorY';
}

export interface Spike extends VectorOptions {
  /**
   * Like vector, but with default *options* suitable for drawing a spike map.
   */
  mark: 'spike';
}
