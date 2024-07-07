import { ParamRef } from '../Param.js';

/** Options for nearest interactors. */
export interface NearestOptions {
  /**
   * The output selection. A clause of the form `field = value`
   * is added for the currently nearest value.
   */
  as: ParamRef;
  /**
   * The encoding channels whose domain values should be selected. For example,
   * a setting of `['color']` selects the data value backing the color channel,
   * whereas `['x', 'z']` selects both x and z channel domain values. If
   * unspecified, the selected channels default to match the current pointer
   * settings: a `nearestX` interactor selects the `['x']` channels, while
   * a `nearest` interactor selects the `['x', 'y']` channels.
   */
  channels?: string[];
  /**
   * The fields (database column names) to use in generated selection clause
   * predicates. If unspecified, the fields backing the selected *channels*
   * in the first valid prior mark definition are used by default.
   */
  fields?: string[];
  /**
   * The maximum radius of a nearest selection (default 40). Marks with (x, y)
   * coordinates outside this radius will not be selected as nearest points.
   */
  maxRadius?: number;
}

/** A nearest interactor. */
export interface Nearest extends NearestOptions {
  /** Select values from the mark closest to the pointer. */
  select: 'nearest';
}

/** A nearestX interactor. */
export interface NearestX extends NearestOptions {
  /** Select values from the mark closest to the pointer *x* location. */
  select: 'nearestX';
}

/** A nearestY interactor. */
export interface NearestY extends NearestOptions {
  /** Select values from the mark closest to the pointer *y* location. */
  select: 'nearestY';
}
