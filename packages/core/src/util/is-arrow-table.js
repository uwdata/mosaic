/**
 * Test if a value is a Flechette Arrow table.
 * We use a "duck typing" approach and check for a getChild function.
 * @param {*} values The value to test
 * @returns {values is import('@uwdata/flechette').Table}
 *  true if the value duck types as Arrow data
 */
export function isArrowTable(values) {
  return typeof values?.getChild === 'function';
}
