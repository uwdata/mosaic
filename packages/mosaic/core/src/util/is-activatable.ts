import type { Activatable } from '../types.js';

/**
 * Test if a value implements the Activatable interface.
 * @param value The value to test.
 * @returns True if value implements Activatable interface.
 */
export function isActivatable(value: unknown): value is Activatable {
  // @ts-expect-error check properties of unknown value
  return typeof value?.activate === 'function' && value.activate.length === 0;
}