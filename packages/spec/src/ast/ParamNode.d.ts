import { SpecSelection } from './SelectionNode.js';

export type SpecParamDefinition =
  | SpecParamValue
  | SpecParam
  | SpecSelection;

export type SpecParamValue =
  | SpecParamLiteral
  | Array<SpecParamLiteral | SpecParamRef>;

export type SpecParamLiteral =
  | string
  | number
  | boolean;

export type SpecParamRef = `$${string}`;

export type SpecParam =
  | { select?: 'value', value: SpecParamValue }
  | { select?: 'value', date: string };
