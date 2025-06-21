import { ParamRef } from '../Param.js';

/** Options for pan/zoom interactors. */
export interface PanZoomOptions {
  /**
   * The output selection for the `x` domain.
   * A clause of the form `field BETWEEN x1 AND x2` is added for the
   * current pan/zom interval [x1, x2].
   */
  x?: ParamRef;
  /**
   * The output selection for the `y` domain.
   * A clause of the form `field BETWEEN y1 AND y2` is added for the
   * current pan/zom interval [y1, y2].
   */
  y?: ParamRef;
  /**
   * The name of the field (database column) over which the `x`-component
   * of the pan/zoom interval should be defined. If unspecified, the `x`
   * channel field of the first valid prior mark definition is used.
   */
  xfield?: string;
  /**
   * The name of the field (database column) over which the `y`-component
   * of the pan/zoom interval should be defined. If unspecified, the `y`
   * channel field of the first valid prior mark definition is used.
   */
  yfield?: string;
}

/** A pan interactor. */
export interface Pan extends PanZoomOptions {
  /** Pan a plot along both the `x` and `y` scales. */
  select: 'pan';
}

/** A panX interactor. */
export interface PanX extends PanZoomOptions {
  /** Pan a plot along the `x` scale only. */
  select: 'panX';
}

/** A panY interactor. */
export interface PanY extends PanZoomOptions {
  /** Pan a plot along the `y` scale only. */
  select: 'panY';
}

/** A panZoom interactor. */
export interface PanZoom extends PanZoomOptions {
  /** Pan and zoom a plot along both the `x` and `y` scales. */
  select: 'panZoom';
}

/** A panZoomX interactor. */
export interface PanZoomX extends PanZoomOptions {
  /** Pan and zoom a plot along the `x` scale only. */
  select: 'panZoomX';
}

/** A panZoomY interactor. */
export interface PanZoomY extends PanZoomOptions {
  /** Pan and zoom a plot along the `y` scale only. */
  select: 'panZoomY';
}
