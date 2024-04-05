import { ParamRef } from '../Param.js';
import {
  ChannelValueSpec, CurveAutoOptions, MarkData, MarkOptions, MarkerOptions
} from './Marks.js';

/** Options for the link mark. */
export interface LinkOptions extends MarkData, MarkOptions, MarkerOptions, CurveAutoOptions {
  /**
   * The horizontal position, for vertical links; typically bound to the *x*
   * scale; shorthand for setting defaults for both **x1** and **x2**.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position, for horizontal links; typically bound to the *y*
   * scale; shorthand for setting defaults for both **y1** and **y2**.
   */
  y?: ChannelValueSpec;

  /**
   * The starting horizontal position; typically bound to the *x* scale; also
   * sets a default for **x2**.
   */
  x1?: ChannelValueSpec;

  /**
   * The starting vertical position; typically bound to the *y* scale; also sets
   * a default for **y2**.
   */
  y1?: ChannelValueSpec;

  /**
   * The ending horizontal position; typically bound to the *x* scale; also sets
   * a default for **x1**.
   */
  x2?: ChannelValueSpec;

  /**
   * The ending vertical position; typically bound to the *y* scale; also sets a
   * default for **y1**.
   */
  y2?: ChannelValueSpec;

  /**
   * The curve (interpolation) method for connecting adjacent points.
   *
   * Since a link has exactly two points, only the following curves (or a custom
   * curve) are recommended: *linear*, *step*, *step-after*, *step-before*,
   * *bump-x*, or *bump-y*. Note that the *linear* curve is incapable of showing
   * a fill since a straight line has zero area. For a curved link, use an arrow
   * mark with the **bend** option.
   *
   * If the plot uses a spherical **projection**, the default *auto* **curve**
   * will render links as geodesics; to draw a straight line instead, use the
   * *linear* **curve**.
   */
  curve?: CurveAutoOptions['curve'] | ParamRef;
}

/** The link mark. */
export interface Link extends LinkOptions {
  /**
   * A link mark, drawing line segments (curves) connecting pairs of points.
   *
   * If the plot uses a spherical **projection**, the default *auto* **curve**
   * will render links as geodesics; to draw a straight line instead, use the
   * *linear* **curve**.
   */
  mark: 'link';
}
