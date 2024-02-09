/**
 * Set of input widget type names.
 */
export function inputNames(overrides = []) {
  return new Set([
    'menu',
    'search',
    'slider',
    'table',
    ...overrides
  ]);
}
