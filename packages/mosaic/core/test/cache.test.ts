import { describe, it, expect } from 'vitest';
import { lruCache } from '../src/util/cache.js';

describe('lruCache', () => {
  it('evicts the least recently used entry and releases its charge', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { a: 1 }, 40);
    cache.set('b', { b: 2 }, 30);
    expect(cache.bytes()).toBe(70);
    cache.get('a');
    cache.set('c', { c: 3 }, 40);

    expect(cache.get('a')).toEqual({ a: 1 });
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toEqual({ c: 3 });
    expect(cache.bytes()).toBe(80);
    cache.clear();
    expect(cache.bytes()).toBe(0);
  });

  it('replaces the charge when an existing key is set again', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { n: 1 }, 30);
    cache.set('a', { n: 2 }, 60);
    cache.set('b', { n: 3 }, 40);

    expect(cache.get('a')).toEqual({ n: 2 });
    expect(cache.get('b')).toEqual({ n: 3 });
    expect(cache.bytes()).toBe(100);
  });

  it('does not store a value larger than the budget', () => {
    const cache = lruCache({ maxBytes: 100 });
    const big = { rows: 1 };
    expect(cache.set('a', big, 101)).toBe(big);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.bytes()).toBe(0);
  });
});
