import { ParamRef } from '../Param.js';
import { InsetOptions, MarkOptions } from './Marks.js';
import { RectCornerOptions } from './Rect.js';

/** Options for the frame decoration mark. */
export interface FrameOptions extends MarkOptions, InsetOptions, RectCornerOptions {
  /**
   * If null (default), the rectangular outline of the frame is drawn;
   * otherwise the frame is drawn as a line only on the given side, and the
   * **rx**, **ry**, **fill**, and **fillOpacity** options are ignored.
   */
  anchor?: 'top' | 'right' | 'bottom' | 'left' | null | ParamRef;
}

export interface Frame extends FrameOptions {
  /**
   * Draws a rectangle around the plot’s frame, or if an **anchor** is given,
   * a line on the given side. Useful for visual separation of facets, or in
   * conjunction with axes and grids to fill the frame’s background.
   */
  mark: 'frame';
}
