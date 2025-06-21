import { ParamRef } from './Param.js';

/** A menu input component. */
export interface Menu {
  /**
   * A menu input widget.
   */
  input: 'menu';
  /**
   * The output selection. A selection clause is added for the
   * currently selected menu option.
   */
  as?: ParamRef;
  /**
   * The database column name to use within generated selection clause
   * predicates. Defaults to the `column` property.
   */
  field?: string;
  /**
   * The name of a database table to use as a data source for this widget.
   * Used in conjunction with the `column` property.
   */
  from?: string;
  /**
   * The name of a database column from which to pull menu options.
   * The unique column values are used as menu options.
   * Used in conjunction with the `from` property.
   */
  column?: string;
  /**
   * A selection to filter the database table indicated by the `from` property.
   */
  filterBy?: ParamRef;
  /**
   * A text label for this input.
   */
  label?: string;
  /**
   * An array of menu options, as literal values or option objects.
   * Option objects have a `value` property and an optional `label` property.
   * If no label is provided, the string-coerced value is used.
   */
  options?: Array<any | { value: any, label?: string }>;
  /**
   * The initial selected menu value.
   */
  value?: any;
}

/** A search input component. */
export interface Search {
  /**
   * A text search input widget.
   */
  input: 'search';
  /**
   * The output selection. A selection clause is added for the
   * current text search query.
   */
  as?: ParamRef;
  /**
   * The database column name to use within generated selection clause
   * predicates. Defaults to the `column` property.
   */
  field?: string;
  /**
   * The type of text search query to perform. One of:
   * - `"contains"` (default): the query string may appear anywhere in the text
   * - `"prefix"`: the query string must appear at the start of the text
   * - `"suffix"`: the query string must appear at the end of the text
   * - `"regexp"`: the query string is a regular expression the text must match
   */
  type?: 'contains' | 'prefix' | 'suffix' | 'regexp';
  /**
   * The name of a database table to use as an autocomplete data source
   * for this widget. Used in conjunction with the `column` property.
   */
  from?: string;
  /**
   * The name of a database column from which to pull valid search results.
   * The unique column values are used as search autocomplete values.
   * Used in conjunction with the `from` property.
   */
  column?: string;
  /**
   * A selection to filter the database table indicated by the `from` property.
   */
  filterBy?: ParamRef;
  /**
   * A text label for this input.
   */
  label?: string;
}

/** A slider input component. */
export interface Slider {
  /**
   * A slider input widget.
   */
  input: 'slider';
  /**
   * The output selection. A selection clause is added for the
   * currently selected slider option.
   */
  as?: ParamRef;
  /**
   * The database column name to use within generated selection clause
   * predicates. Defaults to the `column` property.
   */
  field?: string;
  /**
   * The type of selection clause predicate to generate if the **as** option
   * is a Selection. If `'point'` (the default), the selection predicate is an
   * equality check for the slider value. If `'interval'`, the predicate checks
   * an interval from the minimum to the current slider value.
   */
  select?: 'point' | 'interval';
  /**
   * The name of a database table to use as a data source for this widget.
   * Used in conjunction with the `column` property.
   * The minimum and maximum values of the column determine the slider range.
   */
  from?: string;
  /**
   * The name of a database column whose values determine the slider range.
   * Used in conjunction with the `from` property.
   * The minimum and maximum values of the column determine the slider range.
   */
  column?: string;
  /**
   * A selection to filter the database table indicated by the `from` property.
   */
  filterBy?: ParamRef;
  /**
   * The minumum slider value.
   */
  min?: number;
  /**
   * The maximum slider value.
   */
  max?: number;
  /**
   * The slider step, the amount to increment between consecutive values.
   */
  step?: number;
  /**
   * A text label for this input.
   */
  label?: string;
  /**
   * The initial slider value.
   */
  value?: number;
  /**
   * The width of the slider in screen pixels.
   */
  width?: number;
}

/** A table grid view component. */
export interface Table {
  /**
   * A table grid widget.
   */
  input: 'table';
  /**
   * The output selection. A selection clause is added for each
   * currently selected table row.
   */
  as?: ParamRef;
  /**
   * The name of a database table to use as a data source for this widget.
   */
  from: string | ParamRef;
  /**
   * A list of column names to include in the table grid.
   * If unspecified, all table columns are included.
   */
  columns?: string[];
  /**
   * A selection to filter the database table indicated by the `from` property.
   */
  filterBy?: ParamRef;
  /**
   * An object of per-column alignment values.
   * Column names should be object keys, which map to alignment values.
   * Valid alignment values are: `"left"`, `"right"`, `"center"`, and `"justify"`.
   * By default, numbers are right-aligned and other values are left-aligned.
   */
  align?: { [column: string]: 'left' | 'right' | 'center' | 'justify' };
  /**
   * If a number, sets the total width of the table widget, in pixels.
   * If an object, provides per-column pixel width values.
   * Column names should be object keys, mapped to numeric width values.
   */
  width?: number | { [column : string]: number };
  /**
   * The maximum width of the table widget, in pixels.
   */
  maxWidth?: number;
  /**
   * The height of the table widget, in pixels.
   */
  height?: number;
  /**
   * The number of rows load in a new batch upon table scroll.
   */
  rowBatch?: number;
}
