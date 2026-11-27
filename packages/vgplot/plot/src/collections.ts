export function setUnion<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): ReadonlySet<T> {
  let [big, small] = [left, right];
  if (big.size < small.size) {
    small = big;
    big = small;
  }
  const cloned = new Set(big);
  for (const el of small) {
    cloned.add(el);
  }
  return cloned;
}

/**
 * Remove `key` from `mapping` and return the corresponding value.
 *
 * If the key is not found, returns `defaultValue`.
 */
export function mapPop<V, D = undefined>(
  mapping: Map<any, V>,
  key: unknown,
  defaultValue?: D,
): V | D {
  const value = mapping.get(key);
  return value !== undefined ? (mapping.delete(key), value) : defaultValue;
}

/** Get `key` from `mapping` if present, or `defaultValue`. */
export function mapGet<V, D = undefined>(
  mapping: Map<any, V>,
  key: unknown,
  defaultValue: D,
): V | D {
  const value = mapping.get(key);
  return value !== undefined ? value : defaultValue;
}

/** Get `key` from `mapping` if present, or inserts and returns `defaultValue`. */
export function mapGetOrInsert<K, V>(mapping: Map<K, V>, key: K, defaultValue: V): V {
  const value = mapping.get(key);
  return value !== undefined ? value : (mapping.set(key, defaultValue), defaultValue);
}

/**
 * Get `key` from `mapping` if present, or the result of `callback` is inserted and returned.
 *
 * Unlike [`Map.getOrInsertComputed`][1], the `callback` does not take arguments.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsertComputed
 */
export function mapGetOrInsertLazy<K, V>(mapping: Map<K, V>, key: K, callback: () => V): V {
  const value = mapping.get(key);
  if (value !== undefined) {
    return value;
  }
  const defaultValue = callback();
  mapping.set(key, defaultValue);
  return defaultValue;
}
