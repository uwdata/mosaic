/**
 * Test if a value implements the ClauseSource interface.
 * @param {*} value The value to test.
 * @returns {value is import('./selection-types.js').ClauseSource}
 */
export function isClauseSource(value) {
  return typeof value?.activate === 'function' && // Activate exists
    value.activate.length === 0 && // No arguments
    typeof value?.reset === 'function' && // Reset exists
    value.reset.length === 0 && // No arguments
    typeof value?.clause === 'function'; // Clause exists
}
