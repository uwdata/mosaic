import { Component } from './Spec.js';

/** A zconcat component. */
export interface ZConcat {
  /**
   * Layer components on top of one another, in order: later components are
   * drawn over earlier ones. The layout is as large as its largest component,
   * and smaller components align to its top-left corner.
   */
  zconcat: Component[];
}
