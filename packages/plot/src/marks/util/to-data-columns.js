import { convertArrowColumn, isArrowTable } from '@uwdata/mosaic-core';

/**
 * Convert input data to a set of column arrays.
 * @param {any} data The input data.
 * @returns An object of named column arrays.
 */
export function toDataColumns(data) {
  return isArrowTable(data)
    ? arrowToColumns(data)
    : arrayToColumns(data);
}

/**
 * Convert an Arrow table to a set of column arrays.
 * @param {import('apache-arrow').Table} data An Apache Arrow Table.
 * @returns An object of named column arrays.
 */
function arrowToColumns(data) {
  const { numRows, numCols, schema: { fields } } = data;
  const columns = {};

  for (let col = 0; col < numCols; ++col) {
    const name = fields[col].name;
    if (columns[name]) {
      console.warn(`Redundant column name "${name}". Skipping...`);
    } else {
      columns[name] = convertArrowColumn(data.getChildAt(col));
    }
  }

  return { numRows, columns };
}

/**
 * Convert an array of values to a set of column arrays.
 * If the array values are objects, build out named columns.
 * We use the keys of the first object as the column names.
 * Otherwise, use a special "values" array.
 * @param {object[]} data An array of data objects.
 * @returns An object of named column arrays.
 */
function arrayToColumns(data) {
  const numRows = data.length;
  if (typeof data[0] === 'object') {
    const names = numRows ? Object.keys(data[0]) : [];
    const columns = {};
    if (names.length > 0) {
      names.forEach(name => {
        columns[name] = data.map(d => d[name]);
      });
    }
    return { numRows, columns };
  } else {
    return { numRows, values: data };
  }
}
