import { DataType } from "apache-arrow";

/**
 * Test if a value is an Apache Arrow table.
 * As sometimes multiple Arrow versions may be used simultaneously,
 * we use a "duck typing" approach and check for a getChild function.
 * @param {*} values The value to test
 * @returns true if the value duck types as Apache Arrow data
 */
export function isArrowTable(values) {
  return typeof values?.getChild === 'function';
}

/**
 * Checks whether the Arrow data type needs special handling.
 *
 * @param {DataType} type An Arrow data type.
 */
export function needsConversion(type) {
  return DataType.isInt(type) && type.bitWidth >= 64 || DataType.isTimestamp(type) || DataType.isDecimal(type);
}

/**
  * Return a JavaScript array type for an Apache Arrow column type.
  * @param {DataType} type an Apache Arrow column type
  * @returns a JavaScript array constructor
  */
export function convertArrowArrayType(type) {
  if (DataType.isInt(type) || DataType.isFloat(type) || DataType.isDecimal(type)) {
    return Float64Array;
  }
  return Array;
}

/**
 * Return a function that converts Apache Arrow values to JavaScript values.
 * Timestamps are converted to Date values.
 * Large integers (BigInt) are converted to Float64 numbers.
 * Fixed-point decimal values are convert to Float64 numbers.
 * Otherwise, the default Arrow values are used.
 * @param {*} type an Apache Arrow column type
 * @returns a value conversion function
 */
export function convertArrowValue(type) {
  // map timestamp numbers to date objects
  if (DataType.isTimestamp(type)) {
    return v => v == null ? v : new Date(v);
  }

  // map bigint to number
  if (DataType.isInt(type) && type.bitWidth >= 64) {
    return v => v == null ? v : Number(v);
  }

  // map decimal to number
  if (DataType.isDecimal(type)) {
    const scale = 1 / Math.pow(10, type.scale);
    return v => v == null ? v : decimalToNumber(v, scale);
  }

  // otherwise use Arrow JS defaults
  return v => v;
}

/**
 * Convert an Apache Arrow column to a JavaScript array.
 * Timestamps are converted to Date values.
 * Large integers (BigInt) are converted to Float64 numbers.
 * Fixed-point decimal values are convert to Float64 numbers.
 * Otherwise, the default Arrow values are used.
 * @param {*} column An Apache Arrow column
 * @returns an array of values
 */
export function convertArrowColumn(column) {
  const { type } = column;

  // map timestamp numbers to date objects
  if (DataType.isTimestamp(type)) {
    const size = column.length;
    const array = new Array(size);
    for (let row = 0; row < size; ++row) {
      const v = column.get(row);
      array[row] = v == null ? null : new Date(v);
    }
    return array;
  }

  // map bigint to number
  if (DataType.isInt(type) && type.bitWidth >= 64) {
    const size = column.length;
    const array = new Float64Array(size);
    for (let row = 0; row < size; ++row) {
      const v = column.get(row);
      array[row] = v == null ? NaN : Number(v);
    }
    return array;
  }

  // map decimal to number
  if (DataType.isDecimal(type)) {
    const scale = 1 / Math.pow(10, type.scale);
    const size = column.length;
    const array = new Float64Array(size);
    for (let row = 0; row < size; ++row) {
      const v = column.get(row);
      array[row] = v == null ? NaN : decimalToNumber(v, scale);
    }
    return array;
  }

  // otherwise use Arrow JS defaults
  return column.toArray();
}

// generate base values for big integers
// represented within a Uint32Array
const BASE32 = Array.from(
  { length: 8 },
  (_, i) => Math.pow(2, i * 32)
);

/**
 * Convert a fixed point decimal value to a double precision number.
 * Note: if the value is sufficiently large the conversion may be lossy!
 * @param {Uint32Array} v a fixed decimal value
 * @param {number} scale a scale factor, corresponding to the
 *  number of fractional decimal digits in the fixed point value
 * @returns the resulting number
 */
function decimalToNumber(v, scale) {
  const n = v.length;
  let x = 0;

  if (v.signed && (v[n - 1] | 0) < 0) {
    for (let i = 0; i < n; ++i) {
      x += ~v[i] * BASE32[i];
    }
    x = -(x + 1);
  } else {
    for (let i = 0; i < n; ++i) {
      x += v[i] * BASE32[i];
    }
  }

  return x * scale;
}
