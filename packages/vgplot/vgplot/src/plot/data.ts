
/**
 * @param {string | import("@uwdata/mosaic-core").Param} table
 * @param {object} [options]
 * @param {string | import("@uwdata/mosaic-core").Param} [options.filterBy]
 * @param {boolean} [options.optimize]
 */
export function from(table, options = undefined) {
  return { table, options };
}
