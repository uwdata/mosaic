import { DataDefinition } from './Data.js';
import { ParamDefinition, ParamRef } from './Param.js';
import { HConcat } from './HConcat.js';
import { VConcat } from './VConcat.js';
import { HSpace } from './HSpace.js';
import { VSpace } from './VSpace.js';
import { Menu, Search, Slider, Table } from './Input.js';
import { Plot } from './Plot.js';
import { PlotMark } from './PlotMark.js';
import { Legend } from './PlotLegend.js';
import { PlotAttributes } from './PlotAttribute.js';

/** Specification metadata. */
export interface Meta extends Record<string, any> {
  /** The specification title. */
  title?: string;
  /** A description of the specification content.  */
  description?: string;
  /** Credits or other acknowledgements. */
  credit?: string;
}

/** Configuration options. */
export interface Config extends Record<string, any> {
  extensions?: string | string[];
}

/** Top-level dataset definitions. */
export type Data = Record<string, DataDefinition>;

/** Top-level Param and Selection definitions. */
export type Params = Record<string, ParamDefinition>;

/** Top-level specification properties. */
export interface SpecHead {
  /**
   * A [JSON schema](http://json-schema.org/) URL for this specification,
   * such as https://uwdata.github.io/mosaic/schema/latest.json. This property
   * enables validation and autocomplete in editors with JSON schema support.
   * @format uri
   */
  $schema?: string;
  /** Specification metadata. */
  meta?: Meta;
  /** Configuration options. */
  config?: Config;
  /** Dataset definitions. */
  data?: Data;
  /** Param and Selection definitions. */
  params?: Params;
  /** A default set of attributes to apply to all plot components. */
  plotDefaults?: PlotAttributes;
}

/** A specifcation component such as a plot, input widget, or layout. */
export type Component =
  | HConcat
  | VConcat
  | HSpace
  | VSpace
  | Menu
  | Search
  | Slider
  | Table
  | Plot
  | PlotMark
  | Legend;

/** A declarative Mosaic specification. */
export type Spec = SpecHead & Component;
