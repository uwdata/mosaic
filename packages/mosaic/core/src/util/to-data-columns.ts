import { isArrowTable } from './is-arrow-table.js';
import type { Table } from '@uwdata/flechette';

/**
 * An Array or TypedArray
 */
type Arrayish = Array<any> | Int8Array | Uint8Array | Uint8ClampedArray
  | Int16Array | Uint16Array | Int32Array | Uint32Array
  | Float32Array | Float64Array;

/**
 * Data columns structure with either named columns or values array
 */
type DataColumns = 
  | { numRows: number; columns: Record<string, Arrayish> }
  | { numRows: number; values: Arrayish };

/**
 * Convert input data to a set of column arrays.
 * @param data The input data.
 * @returns An object with named column arrays.
 */
export function toDataColumns(data: any): DataColumns {
  return isArrowTable(data)
    ? arrowToColumns(data)
    : arrayToColumns(data);
}

/**
 * Convert an Arrow table to a set of column arrays.
 * @param data An Arrow Table.
 * @returns An object with named column arrays.
 */
function arrowToColumns(data: Table): DataColumns {
  const { numRows } = data;
  return { numRows, columns: data.toColumns() as Record<string, Arrayish> };
}

/**
 * Convert an array of values to a set of column arrays.
 * If the array values are objects, build out named columns.
 * We use the keys of the first object as the column names.
 * Otherwise, use a special "values" array.
 * @param data An array of data objects.
 * @returns An object with named column arrays.
 */
function arrayToColumns(data: any[]): DataColumns {
  const numRows = data.length;
  if (typeof data[0] === 'object') {
    const names = numRows ? Object.keys(data[0]) : [];
    const columns: Record<string, any[]> = {};
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