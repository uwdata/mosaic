import { InternSet, ascending } from 'd3';
import { convertArrowColumn, convertArrowType, isArrowTable } from './arrow.js';

function arrayType(values, name = 'density') {
  if (isArrowTable(values)) {
    return convertArrowType(values.getChild(name).type);
  } else {
    return typeof values[0][name] === 'number' ? Float64Array : Array;
  }
}

export function grid1d(n, values) {
  const Type = arrayType(values);
  return valuesToGrid(new Type(n), values);
}

function valuesToGrid(grid, values, name = 'density') {
  if (isArrowTable(values)) {
    // optimize access for Arrow tables
    const numRows = values.numRows;
    if (numRows === 0) return grid;
    const index = convertArrowColumn(values.getChild('index'));
    const value = convertArrowColumn(values.getChild(name));
    for (let row = 0; row < numRows; ++row) {
      grid[index[row]] = value[row];
    }
  } else {
    // fallback to iterable data
    for (const row of values) {
      grid[row.index] = row[name];
    }
  }
  return grid;
}

export function grid2d(w, h, values, aggr, groupby = [], interpolate) {
  const size = w * h;
  const Types = aggr.map(name => arrayType(values, name));
  const numAggr = aggr.length;

  // grid data tuples
  const createCell = (key) => {
    const cell = {};
    groupby.forEach((name, i) => cell[name] = key[i]);
    aggr.forEach((name, i) => cell[name] = new Types[i](size));
    return cell;
  };
  const cellMap = {};
  const baseCell = groupby.length ? null : (cellMap[[]] = createCell([]));
  const getCell = groupby.length
    ? key => cellMap[key] ?? (cellMap[key] = createCell(key))
    : () => baseCell;

  // early exit if empty query result
  const numRows = values.numRows;
  if (numRows === 0) return Object.values(cellMap);

  // extract arrays from arrow table
  const index = convertArrowColumn(values.getChild('index'));
  const value = aggr.map(name => convertArrowColumn(values.getChild(name)));
  const groups = groupby.map(name => values.getChild(name));

  if (!interpolate) {
    // if no interpolation, copy values over
    for (let row = 0; row < numRows; ++row) {
      const key = groups.map(vec => vec.get(row));
      const cell = getCell(key);
      for (let i = 0; i < numAggr; ++i) {
        cell[aggr[i]][index[row]] = value[i][row];
      }
    }
  } else {
    // prepare index arrays, then interpolate grid values
    const X = index.map(k => k % w);
    const Y = index.map(k => Math.floor(k / w));
    if (groupby.length) {
      for (let row = 0; row < numRows; ++row) {
        const key = groups.map(vec => vec.get(row));
        const cell = getCell(key);
        if (!cell.index) { cell.index = []; }
        cell.index.push(row);
      }
    } else {
      baseCell.index = index.map((_, i) => i);
    }
    Object.values(cellMap).forEach(cell => {
      for (let i = 0; i < numAggr; ++i) {
        interpolate(cell.index, w, h, X, Y, value[i], cell[aggr[i]]);
      }
      delete cell.index;
    })
  }

  return Object.values(cellMap);
}

export function gridDomainContinuous(grids, prop) {
  let lo = 0, hi = 0;
  grids.forEach(cell => {
    const grid = cell[prop];
    const n = grid.length;
    for (let i = 0; i < n; ++i) {
      const v = grid[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  });
  return (lo === 0 && hi === 0) ? [0, 1] : [lo, hi];
}

export function gridDomainDiscrete(grids, prop) {
    // TODO: sort options?
  const values = new InternSet();
  grids.forEach(cell => {
    const grid = cell[prop];
    const n = grid.length;
    for (let i = 0; i < n; ++i) {
      values.add(grid[i]);
    }
  });
  return Array.from(values).sort(ascending);
}
