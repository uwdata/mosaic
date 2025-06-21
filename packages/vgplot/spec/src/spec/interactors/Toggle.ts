import { ParamRef } from '../Param.js';

/** Options for toggle interactors. */
export interface ToggleOptions {
  /**
   * The output selection. A clause of the form
   * `(field = value1) OR (field = value2) ...`
   * is added for the currently selected values.
   */
  as: ParamRef;
  /**
   * A flag indicating if peer (sibling) marks are excluded when
   * cross-filtering (default `true`). If set, peer marks will not be
   * filtered by this interactor's selection in cross-filtering setups.
   */
  peers?: boolean;
}

/** A toggle interactor. */
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

/** A toggleX interactor. */
export interface ToggleX extends ToggleOptions {
  /**
   * Select individal values in the `x` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleX';
}

/** A toggleY interactor. */
export interface ToggleY extends ToggleOptions {
  /**
   * Select individal values in the `y` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleY';
}

/** A toggleZ interactor. */
export interface ToggleZ extends ToggleOptions {
  /**
   * Select individal values in the `z` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleZ';
}

/** A toggleColor interactor. */
export interface ToggleColor extends ToggleOptions {
  /**
   * Select individal values in the `color` scale domain.
   * Clicking or touching a mark toggles its selection status.
   */
  select: 'toggleColor';
}
