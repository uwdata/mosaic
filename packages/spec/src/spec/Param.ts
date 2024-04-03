export type ParamRef = `$${string}`;

export interface ParamBase {
  /**
   * The type of reactive parameter. One of:
   * - `"value"` (default) for a standard `Param`
   * - `"intersect"` for a `Selection` that intersects clauses (logical "and")
   * - `"union"` for a `Selection` that unions clauses (logical "or")
   * - `"single"` for a `Selection` that retains a single clause only
   * - `"crossfilter"` for a cross-filtered intersection `Selection`
   */
  select?: 'value';
}

export interface Param extends ParamBase {
  /**
   * The initial parameter value.
   */
  value: ParamValue;
}

export interface ParamDate extends ParamBase {
  /**
   * The initial parameter value as an ISO date/time
   * string to be parsed to a Date object.
   */
  date: string;
}

export type ParamLiteral =
  | string
  | number
  | boolean;

export type ParamValue =
  | ParamLiteral
  | Array<ParamLiteral | ParamRef>;

export type SelectionType =
  | 'crossfilter'
  | 'intersect'
  | 'single'
  | 'union';

export interface Selection {
  /**
   * The type of reactive parameter. One of:
   * - `"value"` (default) for a standard `Param`
   * - `"intersect"` for a `Selection` that intersects clauses (logical "and")
   * - `"union"` for a `Selection` that unions clauses (logical "or")
   * - `"single"` for a `Selection` that retains a single clause only
   * - `"crossfilter"` for a cross-filtered intersection `Selection`
   */
  select: SelectionType;
  /**
   * A flag for cross-filtering, where selections made in a plot filter others
   * but not oneself (default `false`, except for `crossfilter` selections).
   */
  cross?: boolean;
}

export type ParamDefinition =
  | ParamValue
  | Param
  | ParamDate
  | Selection;
