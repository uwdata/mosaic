import { ParamRef } from './Param.js';

/**
 * An array of inline data values to visualize. As this data does not come
 * from a database, it can not be filtered by interactive selections.
 */
export type PlotDataInline = any[];

/** Input data specification for a plot mark. */
export interface PlotFrom {
  /** The name of the backing data table. */
  from: string | ParamRef;
  /** A selection that filters the mark data. */
  filterBy?: ParamRef;
  /**
   * A flag (default `true`) to enable any mark-specific query optimizations.
   * If `false`, optimizations are disabled to aid testing and debugging.
   */
  optimize?: boolean;
}

/** Input data for a marks */
export type PlotMarkData = PlotDataInline | PlotFrom;
