import { ParamRef } from '../Param.js';

export interface ToggleOptions {
  /**
   * The output selection. A clause of the form
   * `(field = value1) OR (field = value2) ...`
   * is added for the currently selected values.
   */
  as: ParamRef;
  /**
   * A flag indicating if peer (sibling) marks are when cross-filtering
   * (default `true`). If set, peer marks will not be filtered by this
   * interactor's selection in cross-filtering setups.
   */
  peers?: boolean;
}

export interface Toggle extends ToggleOptions {
  /** Select individal values. */
  select: 'toggle';
  /**
   * The encoding channels over which to select values.
   * For a selected mark, selection clauses will cover
   * the backing data fields for each channel.
   */
  channels: string[];
}

export interface ToggleX extends ToggleOptions {
  /**
   * Select individal values in the `x` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleX';
}

export interface ToggleY extends ToggleOptions {
  /**
   * Select individal values in the `y` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleY';
}

export interface ToggleColor extends ToggleOptions {
  /**
   * Select individal values in the `color` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleColor';
}
