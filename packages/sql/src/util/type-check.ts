import type { ParamLike } from '../types.js';

/**
 * Check if a value is a string.
 * @param value The value to check.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is an array.
 * @param value The value to check.
 */
export function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value);
}

/**
 * Check if a value is a dynamic parameter.
 * @param value The value to check.
 */
export function isParamLike(value: unknown): value is ParamLike {
  if (value) {
    const v = value as Record<string,unknown>;
    return typeof v?.addEventListener === 'function'
      && v.dynamic !== false
      && 'value' in v;
  }
  return false;
}
