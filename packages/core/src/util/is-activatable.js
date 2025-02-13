/**
 * Test if a value implements the Activatable interface.
 * @param {*} value The value to test.
 * @returns {value is import('../types.js').Activatable}
 */
export function isActivatable(value) {
  return typeof value?.activate === 'function' && value.activate.length === 0;
}
