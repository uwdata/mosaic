import { isParam } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
/**
 * Utility to check if a value is a Param, and if so, bind a listener.
 * @param value A potentially Param-typed value.
 * @param update Update callback
 * @returns the input value or (if a Param) the current Param value.
 */
export function handleParam<T>(value: T | mc.Param<T>, update: (value: T) => void | Promise<unknown>): T {
  return isParam(value)
    ? (value.addEventListener('value', update), value.value)
    : value;
}
