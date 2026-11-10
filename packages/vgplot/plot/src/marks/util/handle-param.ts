import { isParam } from '@uwdata/mosaic-core';

/**
 * Utility to check if a value is a Param, and if so, bind a listener.
 * @param {*} value A potentially Param-typed value.
 * @param {(value: *) => Promise|void} update Update callback
 * @returns the input value or (if a Param) the current Param value.
 */
export function handleParam(value, update) {
  return isParam(value)
    ? (value.addEventListener('value', update), value.value)
    : value;
}
