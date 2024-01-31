import { menu, search, slider, table } from '@uwdata/mosaic-inputs';

/**
 * Map of input types to instantiation methods.
 */
export function inputMap(overrides = []) {
  return new Map([
    ['menu', menu],
    ['search', search],
    ['slider', slider],
    ['table', table],
    ...overrides
  ]);
}
