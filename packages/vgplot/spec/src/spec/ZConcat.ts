import { Component } from './Spec.js';

/** A zconcat component. */
export interface ZConcat {
  /**
   * Layer components on top of one another, in order: later components are
   * drawn over earlier ones. The layout is as large as its largest component.
   */
  zconcat: Component[];

  /**
   * How to position components narrower than the layout. A number in [0, 1],
   * such as:
   *
   * - 0 (default) - align to the left
   * - 0.5 - center horizontally
   * - 1 - align to the right
   */
  halign?: number;

  /**
   * How to position components shorter than the layout. A number in [0, 1],
   * such as:
   *
   * - 0 (default) - align to the top
   * - 0.5 - center vertically
   * - 1 - align to the bottom
   */
  valign?: number;
}
