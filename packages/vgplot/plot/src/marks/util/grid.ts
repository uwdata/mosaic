import type { Arrayish } from '@uwdata/mosaic-core';
import { InternSet, ascending } from 'd3';
import * as ObPlot from '@observablehq/plot';

/**
 * Generate a new array with designated size and type.
 * @param size The size of the array
 * @param proto A prototype object of the desired array type.
 *  This may be a typed array or standard array (the default).
 * @returns The generated array.
 */
export function array(size: number, proto: Arrayish = []): Arrayish {
  // @ts-expect-error dynamic instantiation
  return new proto.constructor(size);
}

/**
 * Create a 1D grid for the given sample values
 * @param size The grid size.
 * @param index The grid indices for sample points.
 * @param value The sample point values.
 * @param columns Named column arrays with groupby values.
 * @param groupby The names of columns to group by.
 * @returns Named column arrays of generated grid values.
 */
export function grid1d(size: number, index: Arrayish, value: Arrayish, columns: Record<string, Arrayish>, groupby: string[]): {
  numRows: number;
  columns: { [key: string]: Arrayish; };
} {
  if (!index?.length) return { numRows: 0, columns: {} };
  const numRows = index.length;
  const result: { [key: string]: Arrayish; } = {};
  const cells = [];

  // if grouped, generate per-row group indices
  if (groupby?.length) {
    const group = new Int32Array(numRows);
    const gvalues = groupby.map(name => columns[name]);
    const cellMap = {};
    for (let row = 0; row < numRows; ++row) {
      const key = gvalues.map(group => group[row]);
      //@ts-expect-error Type 'unknown[]' cannot be used as an index type.
      group[row] = cellMap[key] ??= cells.push(key) - 1;
    }
    for (let i = 0; i < groupby.length; ++i) {
      result[groupby[i]] = cells.map(cell => cell[i]);
    }
    const G = result._grid = cells.map(() => array(size, value));
    for (let row = 0; row < numRows; ++row) {
      //@ts-expect-error Type 'unknown' cannot be used as an index type.
      G[group[row]][index[row]] = value[row];
    }
  } else {
    cells.push([]); // single group
    const [G] = result._grid = [array(size, value)];
    for (let row = 0; row < numRows; ++row) {
      //@ts-expect-error Type 'unknown' cannot be used as an index type.
      G[index[row]] = value[row];
    }
  }

  return { numRows: cells.length, columns: result };
}

/**
 * Create a 2D grid for the given sample values.
 * Can handle multiple grids and groupby values per output row.
 * @param w The grid width.
 * @param h The grid height.
 * @param index The grid indices for sample points.
 *  An index value is an integer of the form (y * w + x).
 * @param columns Named column arrays with sample point values.
 * @param aggregates The names of aggregate columns to grid.
 * @param groupby The names of additional columns to group by.
 * @param interpolate A grid interpolation function.
 *  By default sample values are directly copied to output grid arrays.
 * @returns Named column arrays of generated grid values.
 */
export function grid2d(w: number, h: number, index: Arrayish, columns: Record<string, Arrayish>, aggregates: string[], groupby: string[], interpolate: ObPlot.RasterInterpolateFunction): {
  numRows: number;
  columns: { [key: string]: Arrayish; };
} {
  if (!index?.length) return { numRows: 0, columns: {} };
  const numRows = index.length;
  const size = w * h;
  const values = aggregates.map(name => columns[name]);
  const result: { [key: string]: Arrayish; } = {};
  const cells: any[] = [];
  const group = new Int32Array(numRows);

  // if grouped, generate per-row group indices
  if (groupby?.length) {
    const gvalues = groupby.map(name => columns[name]);
    const cellMap = {};
    for (let row = 0; row < numRows; ++row) {
      const key = gvalues.map(group => group[row]);
      //@ts-expect-error Type 'unknown[]' cannot be used as an index type.
      group[row] = cellMap[key] ??= cells.push(key) - 1;
    }
    for (let i = 0; i < groupby.length; ++i) {
      result[groupby[i]] = cells.map(cell => cell[i]);
    }
  } else {
    cells.push([]); // single group
  }

  if (interpolate) {
    // prepare index arrays, then interpolate grid values
    const X = index.map((k: any) => k % w);
    const Y = index.map((k: any) => Math.floor(k / w));
    const I = cells.map((): any[] => []);
    for (let row = 0; row < numRows; ++row) {
      I[group[row]].push(row);
    }
    aggregates.forEach((name, i) => {
      const V = values[i];
      result[name] = cells.map((_, j) => interpolate(I[j], w, h, X as number[], Y as number[], V as number[]));
    });
  } else {
    // no interpolation, copy values directly to grids
    aggregates.forEach((name, i) => {
      const V = values[i];
      const G = result[name] = cells.map(() => array(size, V));
      for (let row = 0; row < numRows; ++row) {
        //@ts-expect-error Type 'unknown' cannot be used as an index type.
        G[group[row]][index[row]] = V[row];
      }
    });
  }

  return { numRows: cells.length, columns: result };
}

export function gridDomainContinuous(grids: Arrayish): number[] {
  let lo = Infinity, hi = -Infinity;
  grids.forEach((G: any) => {
    const n = G.length;
    for (let i = 0; i < n; ++i) {
      const v = G[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  });
  return (Number.isFinite(lo) && Number.isFinite(hi)) ? [lo, hi] : [0, 1];
}

export function gridDomainDiscrete(grids: Arrayish): any[] {
  // TODO: sort options?
  const values = new InternSet();
  grids.forEach((G: any) => {
    const n = G.length;
    for (let i = 0; i < n; ++i) {
      values.add(G[i]);
    }
  });
  return Array.from(values).sort(ascending);
}
