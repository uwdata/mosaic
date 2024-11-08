/**
 * Check if a value is a string.
 * @param {*} value The value to check.
 * @returns {value is string}
 */
export function isString(value) {
  return typeof value === 'string';
}

/**
 * Check if a value is an array.
 * @param {*} value The value to check.
 * @returns {value is Array}
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Check if a value is a dynamic parameter.
 * @param {*} value The value to check.
 * @returns {value is import('../types.js').ParamLike}
 */
export function isParamLike(value) {
  return value
    && typeof value.addEventListener === 'function'
    && value.dynamic !== false
    && 'value' in value;
}
