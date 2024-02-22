import { convertArrow, isArrowTable } from './arrow.js';

export function toDataArray(data) {
  return isArrowTable(data) ? arrowToObjects(data) : data;
}

/**
 * Convert Apache Arrow tables to an array of vanilla JS objects.
 * The internal conversions performed by the Arrow JS lib may not
 * always produce values properly interpreted by Observable Plot.
 * In addition, the Arrow JS lib uses Proxy objects to create
 * row (tuple) objects, which can introduce some perf overhead.
 * This method provides custom conversions of data that we can hand
 * to Observable Plot. Internally, Plot will copy input data values
 * into an array-based columnar organizations. If in the future Plot
 * provides an efficient path to directly pass in columnar-data, we
 * can revisit this method.
 */
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
      const valueOf = convertArrow(type);

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
