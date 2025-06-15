import type { Activatable } from '../types.js';

/**
 * Test if a value implements the Activatable interface.
 * @param value The value to test.
 * @returns True if value implements Activatable interface.
 */
export function isActivatable(value: any): value is Activatable {
  return typeof value?.activate === 'function' && value.activate.length === 0;
}