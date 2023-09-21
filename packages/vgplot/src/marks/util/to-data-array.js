import { isArrowTable } from './is-arrow-table.js';

const INTEGER = 2;
const TIMESTAMP = 10;

export function toDataArray(data) {
  return isArrowTable(data) ? arrowToObjects(data) : data;
}

export function arrowToObjects(data) {
  const { batches, numRows: length } = data;

  // return an empty array for empty tables
  if (!length) return [];

  // pre-allocate output objects
  const objects = Array.from({ length }, () => ({}));

  // for each row batch...
  for (let k = 0, b = 0; b < batches.length; ++b) {
    const batch = batches[b];
    const { schema, numRows, numCols } = batch;

    // for each column...
    for (let j = 0; j < numCols; ++j) {
      const child = batch.getChildAt(j);
      const { name, type } = schema.fields[j];
      const valueOf = convert(type);

      // for each row in the current batch...
      for (let o = k, i = 0; i < numRows; ++i, ++o) {
        // extract/convert value from arrow, copy to output object
        objects[o][name] = valueOf(child.get(i));
      }
    }

    k += numRows;
  }

  return objects;
}

function convert(type) {
  const { typeId } = type;

  // map timestamp numbers to date objects
  if (typeId === TIMESTAMP) {
    return v => v == null ? v : new Date(v);
  }

  // map bignum to number
  if (typeId === INTEGER && type.bitWidth >= 64) {
    return v => v == null ? v : Number(v);
  }

  // otherwise use Arrow JS defaults
  return v => v;
}
