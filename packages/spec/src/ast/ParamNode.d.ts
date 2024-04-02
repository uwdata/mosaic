import { SpecParamRef } from './ParamRefNode.js';
import { SpecSelection } from './SelectionNode.js';

export interface SpecParamBase {
  select?: 'value';
}

export interface SpecParam extends SpecParamBase {
  value: SpecParamValue;
}

export interface SpecParamDate extends SpecParamBase {
  date: string;
}

export type SpecParamLiteral =
  | string
  | number
  | boolean;

export type SpecParamValue =
  | SpecParamLiteral
  | Array<SpecParamLiteral | SpecParamRef>;

  export type SpecParamDefinition =
  | SpecParamValue
  | SpecParam
  | SpecParamDate
  | SpecSelection;
