export type ParamRef = `$${string}`;

export interface ParamBase {
  select?: 'value';
}

export interface Param extends ParamBase {
  value: ParamValue;
}

export interface ParamDate extends ParamBase {
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
  select: SelectionType;
  cross?: boolean;
}

export type ParamDefinition =
  | ParamValue
  | Param
  | ParamDate
  | Selection;
