import { InternSet, ascending } from 'd3';
import { DECIMAL, FLOAT, INTEGER, isArrowTable } from './arrow.js';

function arrayType(values, name = 'density') {
  if (isArrowTable(values)) {
    const type = values.getChild(name).type;
    switch (type.typeId) {
      case INTEGER:
      case FLOAT:
      case DECIMAL:
        return Float64Array;
      default:
        return Array;
    }
  } else {
    return typeof values[0][name] === 'number' ? Float64Array : Array;
  }
}

export function grid1d(n, values) {
  const Type = arrayType(values);
  return valuesToGrid(new Type(n), values);
}

export function grid2d(m, n, values, aggr, groupby = []) {
  if (groupby.length) {
    // generate grids per group
    return groupedValuesToGrids(m * n, values, aggr, groupby);
  } else {
    const cell = {};
    aggr.forEach(name => {
      const Type = arrayType(values, name);
      cell[name] = valuesToGrid(new Type(m * n), values, name);
    });
    return [cell];
  }
}

function valuesToGrid(grid, values, name = 'density') {
  if (isArrowTable(values)) {
    // optimize access for Arrow tables
    const numRows = values.numRows;
    if (numRows === 0) return grid;
    const index = values.getChild('index').toArray();
    const value = values.getChild(name).toArray();
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

function groupedValuesToGrids(size, values, aggr, groupby) {
  const Types = aggr.map(name => arrayType(values, name));
  const numAggr = aggr.length;

  const cellMap = {};
  const getCell = key => {
    let cell = cellMap[key];
    if (!cell) {
      cell = cellMap[key] = {};
      groupby.forEach((name, i) => cell[name] = key[i]);
      aggr.forEach((name, i) => cell[name] = new Types[i](size));
    }
    return cell;
  };

  if (isArrowTable(values)) {
    // optimize access for Arrow tables
    const numRows = values.numRows;
    if (numRows === 0) return [];

    const index = values.getChild('index').toArray();
    const value = aggr.map(name => values.getChild(name).toArray());
    const groups = groupby.map(name => values.getChild(name));

    for (let row = 0; row < numRows; ++row) {
      const key = groups.map(vec => vec.get(row));
      const cell = getCell(key);
      for (let i = 0; i < numAggr; ++i) {
        cell[aggr[i]][index[row]] = value[i][row];
      }
    }
  } else {
    // fallback to iterable data
    for (const row of values) {
      const key = groupby.map(col => row[col]);
      const cell = getCell(key);
      for (let i = 0; i < numAggr; ++i) {
        cell[aggr[i]][row.index] = row[aggr[i]];
      }
    }
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
