import { SpecParamRef } from './ParamRefNode.js';

export type SpecInput =
  | SpecMenu
  | SpecSearch
  | SpecSlider
  | SpecTable;

export interface SpecMenu {
  /** Create a menu input widget. */
  input: 'menu';
  /** A selection to which the current menu option is added. */
  as?: SpecParamRef;
  /**
   * A backing data table from which to pull menu options.
   * Used in conjunction with the column property.
   */
  from?: any;
  /**
   * A backing data column from which to pull menu options.
   * Used in conjunction with the from property.
   */
  column?: any;
  /**
   * A selection by which to filter a backing data table.
   * Used in conjunction with the from and column properties.
   */
  filterBy?: SpecParamRef;
  /** A text label for this input. */
  label?: any;
  /**
   * An array of menu options, as literal values or option objects.
   * Option objects have a `value` property and an optional `label` property.
   * If no label is provided, the (string-coerced) value is used.
   */
  options?: any;
  /** The initial selected menu option. */
  value?: any;
}

export interface SpecSearch {
  /** Create a text search input widget. */
  input: 'search';
  /** A selection to which the text search query is added. */
  as?: SpecParamRef;
  /**
   * A backing data table from which to pull valid search results.
   * Used in conjunction with the column property.
   */
  from?: any;
  /**
   * A backing data column from which to pull valid search results.
   * Used in conjunction with the from property.
   */
  column?: any;
  /**
   * A selection by which to filter a backing data table.
   * Used in conjunction with the from and column properties.
   */
  filterBy?: SpecParamRef;
  /** A text label for this input. */
  label?: any;
  /**
   * The type of text search to perform.
   * One of: `"contains"` (default), `"prefix"`, `"suffix"`, or `"regexp"`.
   */
  type?: any;
}

export interface SpecSlider {
  /** Create a slider input widget. */
  input: 'slider';
  /** A selection to which the current slider value is added. */
  as?: SpecParamRef;
  /**
   * A backing data table from which to determine the slider range.
   * Used in conjunction with the column property.
   */
  from?: any;
  /**
   * A backing data column from which to determine the slider range.
   * Used in conjunction with the from property.
   */
  column?: any;
  /**
   * A selection by which to filter a backing data table.
   * Used in conjunction with the from and column properties.
   */
  filterBy?: SpecParamRef;
  /** The minumum slider value. */
  min?: any;
  /** The maximum slider value. */
  max?: any;
  /** The slider step, the increment between consecutive values. */
  step?: any;
  /** A text label for this input. */
  label?: any;
  /** The initial slider value. */
  value?: any;
  /** The width of the slider in screen pixels. */
  width?: any;
}

export interface SpecTable {
  /** Create a table grid widget. */
  input: 'table';
  /**
   * A backing data table from which to pull data for this widget.
   */
  from?: any;
  /**
   * A list of column names to include in the table widget.
   * If unspecified, all table columns are shown.
   */
  columns?: any;
  /**
   * A selection by which to filter a backing data table.
   * Used in conjunction with the from and column properties.
   */
  filterBy?: SpecParamRef;
  /**
   * An object of per-column alignment values.
   * Column names should be object keys, mapped to alignment values.
   * Valid alignment values are: `"left"`, `"right"`, `"center"`, and `"justify"`.
   * By default, numbers are right-aligned and other values are left-aligned.
   */
  align?: any;
  /**
   * If a number, sets the total width of the table widget, in pixels.
   * If an object, provides per-column pixel width values.
   * Column names should be object keys, mapped to numeric width values.
   */
  width?: any;
  /** The maximum width of the table widget, in pixels. */
  maxWidth?: any;
  /** The height of the table widget, in pixels. */
  height?: any;
  /** The number of rows load in a new batch upon table scroll. */
  rowBatch?: any;
}
