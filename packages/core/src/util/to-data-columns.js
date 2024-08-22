import { isArrowTable } from './is-arrow-table.js';

/**
 * @typedef {Array | Int8Array | Uint8Array | Uint8ClampedArray
 *  | Int16Array | Uint16Array | Int32Array | Uint32Array
 *  | Float32Array | Float64Array
 * } Arrayish - an Array or TypedArray
 */

/**
 * @typedef {
 *  | { numRows: number, columns: Record<string,Arrayish> }
 *  | { numRows: number, values: Arrayish; }
 * } DataColumns
*/

/**
 * Convert input data to a set of column arrays.
 * @param {any} data The input data.
 * @returns {DataColumns} An object with named column arrays.
 */
export function toDataColumns(data) {
  return isArrowTable(data)
    ? arrowToColumns(data)
    : arrayToColumns(data);
}

/**
 * Convert an Arrow table to a set of column arrays.
 * @param {import('@uwdata/flechette').Table} data An Arrow Table.
 * @returns {DataColumns} An object with named column arrays.
 */
function arrowToColumns(data) {
  const { numRows } = data;
  return { numRows, columns: data.toColumns() };
}

/**
 * Convert an array of values to a set of column arrays.
 * If the array values are objects, build out named columns.
 * We use the keys of the first object as the column names.
 * Otherwise, use a special "values" array.
 * @param {object[]} data An array of data objects.
 * @returns {DataColumns} An object with named column arrays.
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
