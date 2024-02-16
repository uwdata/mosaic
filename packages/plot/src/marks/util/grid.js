import { isArrowTable } from './is-arrow-table.js';

export function grid1d(n, values) {
  return valuesToGrid(new Float64Array(n), values);
}

export function grid2d(m, n, values, groupby = []) {
  return groupby.length
    ? Object.values(groupedValuesToGrids(m * n, values, groupby))
    : [{ grid: valuesToGrid(new Float64Array(m * n), values) }];
}

function valuesToGrid(grid, values) {
  if (isArrowTable(values)) {
    // optimize access for Arrow tables
    const numRows = values.numRows;
    if (numRows === 0) return grid;
    const index = values.getChild('index').toArray();
    const value = values.getChild('value').toArray();
    for (let row = 0; row < numRows; ++row) {
      grid[index[row]] = value[row];
    }
  } else {
    // fallback to iterable data
    for (const row of values) {
      grid[row.index] = row.value;
    }
  }
  return grid;
}

function groupedValuesToGrids(size, values, groupby) {
  const grids = {};
  const getGrid = key => {
    const cell = grids[key] || (grids[key] = { key, grid: new Float64Array(size) });
    return cell.grid;
  };
  if (isArrowTable(values)) {
    // optimize access for Arrow tables
    const numRows = values.numRows;
    if (numRows === 0) return grids;
    const index = values.getChild('index').toArray();
    const value = values.getChild('value').toArray();
    const groups = groupby.map(name => values.getChild(name));
    for (let row = 0; row < numRows; ++row) {
      const key = groups.map(vec => vec.get(row));
      getGrid(key)[index[row]] = value[row];
    }
  } else {
    // fallback to iterable data
    for (const row of values) {
      const key = groupby.map(col => row[col]);
      getGrid(key)[row.index] = row.value;
    }
  }
  return grids;
}
