import { isArrowTable } from './is-arrow-table.js';
import type { Table } from '@uwdata/flechette';

/**
 * An Array or TypedArray
 */
type Arrayish = Array<unknown> | Int8Array | Uint8Array | Uint8ClampedArray
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
export function toDataColumns(data: unknown): DataColumns {
  if (isArrowTable(data)) {
    return arrowToColumns(data);
  } else if (Array.isArray(data)) {
    return arrayToColumns(data);
  } else {
    throw new Error('Unrecognized data format.');
  }
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
function arrayToColumns(data: Record<string,unknown>[]): DataColumns {
  const numRows = data.length;
  if (typeof data[0] === 'object') {
    const names = numRows ? Object.keys(data[0]!) : [];
    const columns: Record<string, unknown[]> = {};
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