import { ParamRef } from '../Param.js';
import { ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/** Options for the arrow mark. */
export interface ArrowOptions extends MarkData, MarkOptions {
  /**
   * The horizontal position, for vertical arrows; typically bound to the *x*
   * scale; shorthand for setting defaults for both **x1** and **x2**.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position, for horizontal arrows; typically bound to the *y*
   * scale; shorthand for setting defaults for both **y1** and **y2**.
   */
  y?: ChannelValueSpec;

  /**
   * The starting horizontal position; typically bound to the *x* scale; also
   * sets a default for **x2**.
   */
  x1?: ChannelValueSpec;

  /**
   * The starting vertical position; typically bound to the *y* scale; also
   * sets a default for **y2**.
   */
  y1?: ChannelValueSpec;

  /**
   * The ending horizontal position; typically bound to the *x* scale; also
   * sets a default for **x1**.
   */
  x2?: ChannelValueSpec;

  /**
   * The ending vertical position; typically bound to the *y* scale; also sets
   * a default for **y1**.
   */
  y2?: ChannelValueSpec;

  /**
   * The angle, a constant in degrees, between the straight line intersecting
   * the arrow’s two control points and the outgoing tangent direction of the
   * arrow from the start point. The angle must be within ±90°; a positive
   * angle will produce a clockwise curve, while a negative angle will produce
   * a counterclockwise curve; zero (the default) will produce a straight line.
   * Use true for 22.5°.
   */
  bend?: number | boolean | ParamRef;

  /**
   * How pointy the arrowhead is, in degrees; a constant typically between 0°
   * and 180°, and defaults to 60°.
   */
  headAngle?: number | ParamRef;

  /**
   * The size of the arrowhead relative to the **strokeWidth**; a constant.
   * Assuming the default of stroke width 1.5px, this is the length of the
   * arrowhead’s side in pixels.
   */
  headLength?: number | ParamRef;

  /**
   * Shorthand to set the same default for **insetStart** and **insetEnd**.
   */
  inset?: number | ParamRef;

  /**
   * The starting inset, a constant in pixels; defaults to 0. A positive inset
   * shortens the arrow by moving the starting point towards the endpoint
   * point, while a negative inset extends it by moving the starting point in
   * the opposite direction. A positive starting inset may be useful if the
   * arrow emerges from a dot.
   */
  insetStart?: number | ParamRef;

  /**
   * The ending inset, a constant in pixels; defaults to 0. A positive inset
   * shortens the arrow by moving the ending point towards the starting point,
   * while a negative inset extends it by moving the ending point in the
   * opposite direction. A positive ending inset may be useful if the arrow
   * points to a dot.
   */
  insetEnd?: number | ParamRef;

  /**
   * The sweep order; defaults to 1 indicating a positive (clockwise) bend
   * angle; -1 indicates a negative (anticlockwise) bend angle; 0 effectively
   * clears the bend angle. If set to *-x*, the bend angle is flipped when the
   * ending point is to the left of the starting point — ensuring all arrows
   * bulge up (down if bend is negative); if set to *-y*, the bend angle is
   * flipped when the ending point is above the starting point — ensuring all
   * arrows bulge right (left if bend is negative); the sign is negated for
   * *+x* and *+y*.
   */
  sweep?: number | '+x' | '-x' | '+y' | '-y' | ParamRef;
}

/** The arrow mark. */
export interface Arrow extends ArrowOptions {
  /**
   * An arrow mark, drawing (possibly swoopy) arrows connecting pairs of
   * points.
   */
  mark: 'arrow';
}
