const NAMES = ['menu', 'search', 'slider', 'table'] as const;

export type InputName = (typeof NAMES)[number];
/** Set of input widget type names. */
export function inputNames<T extends string>(overrides: T[] = []): Set<T | InputName> {
  return new Set([...NAMES, ...overrides]);
}
