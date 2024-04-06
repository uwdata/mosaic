import { ParamRef } from '../Param.js';

/** Options for nearest interactors. */
export interface NearestOptions {
  /**
   * The output selection. A clause of the form `field = value`
   * is added for the currently nearest value.
   */
  as: ParamRef;
  /**
   * The name of the field (database column) over which the nearest
   * selection should be defined. If unspecified, the  channel field of the
   * first valid prior mark definition is used.
   */
  field?: string;
}

/** A nearestX interactor. */
export interface NearestX extends NearestOptions {
  /** Select the **x** domain value of the mark closest to the pointer. */
  select: 'nearestX';
}

/** A nearestY interactor. */
export interface NearestY extends NearestOptions {
  /** Select the **y** domain value of the mark closest to the pointer. */
  select: 'nearestY';
}
