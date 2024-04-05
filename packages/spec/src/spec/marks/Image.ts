import { ParamRef } from '../Param.js';
import { FrameAnchor } from '../PlotTypes.js';
import { ChannelValue, ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/** Options for the image mark. */
export interface ImageOptions extends MarkData, MarkOptions {
  /**
   * The horizontal position channel specifying the image’s center; typically
   * bound to the *x* scale.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position channel specifying the image’s center; typically
   * bound to the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * The image width in pixels. When a number, it is interpreted as a constant
   * radius in pixels; otherwise it is interpreted as a channel. Also sets the
   * default **height**; if neither are set, defaults to 16. Images with a
   * nonpositive width are not drawn.
   */
  width?: ChannelValue | ParamRef;

  /**
   * The image height in pixels. When a number, it is interpreted as a constant
   * radius in pixels; otherwise it is interpreted as a channel. Also sets the
   * default **height**; if neither are set, defaults to 16. Images with a
   * nonpositive height are not drawn.
   */
  height?: ChannelValue | ParamRef;

  /**
   * The image clip radius, for circular images. If null (default), images are
   * not clipped; when a number, it is interpreted as a constant in pixels;
   * otherwise it is interpreted as a channel, typically bound to the *r* scale.
   * Also defaults **height** and **width** to twice its value.
   */
  r?: ChannelValue | ParamRef;

  /**
   * The rotation angle, in degrees clockwise. When a number, it is interpreted
   * as a constant; otherwise it is interpreted as a channel.
   */
  rotate?: ChannelValue | ParamRef;

  /**
   * The required image URL (or relative path). If a string that starts with a
   * dot, slash, or URL protocol (*e.g.*, “https:”) it is assumed to be a
   * constant; otherwise it is interpreted as a channel.
   */
  src?: ChannelValue | ParamRef;

  /**
   * The image [aspect ratio][1]; defaults to *xMidYMid meet*. To crop the image
   * instead of scaling it to fit, use *xMidYMid slice*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio
   */
  preserveAspectRatio?: string | ParamRef;

  /**
   * The [cross-origin][1] behavior. See the [Plot.image notebook][2] for details.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/crossorigin
   * [2]: https://observablehq.com/@observablehq/plot-image
   */
  crossOrigin?: string | ParamRef;

  /**
   * The frame anchor specifies defaults for **x** and **y** based on the plot’s
   * frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*),
   * one of the four corners (*top-left*, *top-right*, *bottom-right*,
   * *bottom-left*), or the *middle* of the frame.
   */
  frameAnchor?: FrameAnchor | ParamRef;

  /**
   * The [image-rendering attribute][1]; defaults to *auto* (bilinear). The
   * option may be set to *pixelated* to disable bilinear interpolation for a
   * sharper image; however, note that this is not supported in WebKit.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering
   */
  imageRendering?: string | ParamRef;
}

export interface Image extends ImageOptions {
  /**
   * An image mark that draws images as in a scatterplot.
   *
   * If either **x** or **y** is not specified, the default is determined by
   * the **frameAnchor** option. If none of **x**, **y**, and **frameAnchor**
   * are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*],
   * [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …]
   * and **y** = [*y₀*, *y₁*, *y₂*, …].
   */
  mark: 'image';
}
