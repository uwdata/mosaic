import { ParamRef } from '../Param.js';
import { BrushStyles } from './BrushStyles.js';

/** Options for region interactors. */
export interface RegionOptions {
  /**
   * The output selection. A clause of the form
   * `(field = value1) OR (field = value2) ...`
   * is added for the currently selected values.
   */
  as: ParamRef;
  /**
   * The encoding channels over which to select values.
   * For a selected mark, selection clauses will cover
   * the backing data fields for each channel.
   */
  channels: string[];
  /**
   * A flag indicating if peer (sibling) marks are excluded when
   * cross-filtering (default `true`). If set, peer marks will not be
   * filtered by this interactor's selection in cross-filtering setups.
   */
  peers?: boolean;
  /**
   * CSS styles for the brush (SVG `rect`) element.
   */
  brush?: BrushStyles;
}

/** A rectangular region interactor. */
export interface Region extends RegionOptions {
  /** Select aspects of individual marks within a 2D range. */
  select: 'region';
}
