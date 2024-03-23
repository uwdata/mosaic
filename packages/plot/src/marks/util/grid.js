import { InternSet, ascending } from 'd3';

/**
 * Generate a new array with designated size and type.
 * @param {number} size The size of the array
 * @param {ArrayLike} [proto] A prototype object of the desired array type.
 *  This may be a typed array or standard array (the default).
 * @returns {ArrayLike} The generated array.
 */
export function array(size, proto = []) {
  return new proto.constructor(size);
}

/**
 * Create a 1D grid for the given sample values
 * @param {number} size The grid size.
 * @param {ArrayLike} index The grid indices for sample points.
 * @param {ArrayLike} value The sample point values.
 * @returns {ArrayLike} The generated value grid.
 */
export function grid1d(size, index, value) {
  const G = array(size, value);
  const n = value.length;
  for (let i = 0; i < n; ++i) {
    G[index[i]] = value[i];
  }
  return G;
}

/**
 * Create a 2D grid for the given sample values.
 * Can handle multiple grids and groupby values per output row.
 * @param {number} w The grid width.
 * @param {number} h The grid height.
 * @param {ArrayLike} index The grid indices for sample points.
 *  An index value is an integer of the form (y * w + x).
 * @param {ArrayLike} columns Named column arrays with sample point values.
 * @param {string[]} aggregates The names of aggregate columns to grid.
 * @param {string[]} groupby The names of additional columns to group by.
 * @param {function} [interpolate] A grid interpolation function.
 *  By default sample values are directly copied to output grid arrays.
 * @returns {object} Named column arrays of generated grid values.
 */
export function grid2d(w, h, index, columns, aggregates, groupby, interpolate) {
  const numRows = index.length;
  const size = w * h;
  const values = aggregates.map(name => columns[name]);
  const result = {};
  const cells = [];
  const group = new Int32Array(numRows);

  // if grouped, generate per-row group indices
  if (groupby?.length) {
    const gvalues = groupby.map(name => columns[name]);
    const cellMap = {};
    for (let row = 0; row < numRows; ++row) {
      const key = gvalues.map(group => group[row]);
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
    const X = index.map(k => k % w);
    const Y = index.map(k => Math.floor(k / w));
    const I = cells.map(() => []);
    for (let row = 0; row < numRows; ++row) {
      I[group[row]].push(row);
    }
    aggregates.forEach((name, i) => {
      const V = values[i];
      result[name] = cells.map((_, j) => interpolate(I[j], w, h, X, Y, V));
    });
  } else {
    // no interpolation, copy values directly to grids
    aggregates.forEach((name, i) => {
      const V = values[i];
      const G = result[name] = cells.map(() => array(size, V));
      for (let row = 0; row < numRows; ++row) {
        G[group[row]][index[row]] = V[row];
      }
    });
  }

  return { numRows: cells.length, columns: result };
}

export function gridDomainContinuous(grids) {
  let lo = Infinity, hi = -Infinity;
  grids.forEach(G => {
    const n = G.length;
    for (let i = 0; i < n; ++i) {
      const v = G[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  });
  return (Number.isFinite(lo) && Number.isFinite(hi)) ? [lo, hi] : [0, 1];
}

export function gridDomainDiscrete(grids) {
  // TODO: sort options?
  const values = new InternSet();
  grids.forEach(G => {
    const n = G.length;
    for (let i = 0; i < n; ++i) {
      values.add(G[i]);
    }
  });
  return Array.from(values).sort(ascending);
}
