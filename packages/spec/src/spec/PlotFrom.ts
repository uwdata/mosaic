import { ParamRef } from './Param.js';

/** Input data for marks. */
export type PlotMarkData =
  | PlotDataInline
  | PlotFrom;

/**
 * An array of inline data values to visualize. As this data does not come
 * from a database, it can not be filtered by interactive selections.
 */
export type PlotDataInline = any[];

export interface PlotFrom {
  /**
   * The name of the backing data table.
   */
  from: string;
  /**
   * A selection that filters the mark data.
   */
  filterBy?: ParamRef;
  /**
   * A flag (default `true`) to enable any mark-specific query optimizations.
   * If `false`, optimizations are disabled to aid testing and debugging.
   */
  optimize?: boolean;
}
