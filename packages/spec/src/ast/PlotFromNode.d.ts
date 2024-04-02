import { SpecParamRef } from './ParamRefNode.js';

/** Input data for marks. */
export type SpecPlotMarkData =
  | SpecPlotDataInline
  | SpecPlotFrom;

/**
 * An array of inline data values to visualize. As this data does not come
 * from a database, it can not be filtered by interactive selections.
 */
export type SpecPlotDataInline = any[];

export interface SpecPlotFrom {
  /** The name of the backing data table. */
  from: string;
  /** A selection with which to filter the mark data. */
  filterBy?: SpecParamRef;
  /**
   * A flag (default `true`) to enable any mark-specific query optimizations.
   * Set to `false` to disable optimizations to aid testing and debugging.
   */
  optimize?: boolean;
};