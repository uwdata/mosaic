/**
 * Set of input widget type names.
 * @returns {Set<string>}
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
