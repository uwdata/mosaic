/**
 * Functions inspired by Python's [`itertools`][1] and ES2025's [Iterator Helpers][2].
 *
 * [1]: https://docs.python.org/3/library/itertools.html
 *
 * [2]: https://github.com/tc39/proposal-iterator-helpers
 */

/**
 * Alternative {@link chain} constructor taking a single `iterables` argument that evaluates lazily.
 *
 * See also [`chain.from_iterable`][1].
 *
 * [1]: https://docs.python.org/3/library/itertools.html#itertools.chain.from_iterable
 */
export function* chainFromIterable<T>(iterables: Iterable<Iterable<T>>): Iterable<T> {
  for (const iterable of iterables) {
    for (const element of iterable) {
      yield element;
    }
  }
}

/**
 * Yield elements from the first iterable until it is exhausted, then elements from the next
 * iterable, until all of the `iterables` are exhausted.
 *
 * This combines multiple data sources into a single iterator.
 *
 * See also [`chain`][1].
 *
 * [1]: https://docs.python.org/3/library/itertools.html#itertools.chain
 */
export function* chain<T>(...iterables: Iterable<T>[]): Iterable<T> {
  yield* chainFromIterable(iterables);
}

/**
 * Creates an iterator whose values are those from `iterable` for which the provided `predicate`
 * returns true.
 *
 * See also [`Iterator.prototype.filter`][1].
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/filter
 */
export function filter<T, S extends T>(
  iterable: Iterable<T>,
  predicate: (value: T) => value is S,
): Iterable<S>;
export function filter<T>(iterable: Iterable<T>, predicate: (value: T) => unknown): Iterable<T>;
export function* filter<T>(iterable: Iterable<T>, predicate: (value: T) => unknown): Iterable<T> {
  for (const element of iterable) {
    if (predicate(element)) {
      yield element;
    }
  }
}

/**
 * Creates an iterator whose values are the result of applying `callbackfn` to the values from
 * `iterable`.
 *
 * See also [`Iterator.prototype.map`][1].
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/map
 */
export function* map<T, U>(iterable: Iterable<T>, callbackfn: (value: T) => U): Iterable<U> {
  for (const element of iterable) {
    yield callbackfn(element);
  }
}
