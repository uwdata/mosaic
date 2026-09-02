import { describe, it, expect, vi, afterEach } from 'vitest';
import { lruCache } from '../src/util/cache.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lruCache', () => {
  it('evicts the least recently used entry when the budget is exceeded', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { a: 1 }, 40);
    cache.set('b', { b: 2 }, 40);
    cache.get('a');
    cache.set('c', { c: 3 }, 40);

    expect(cache.get('a')).toEqual({ a: 1 });
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toEqual({ c: 3 });
  });

  it('replaces the charge when an existing key is set again', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', Promise.resolve());
    cache.set('a', { n: 2 }, 60);
    cache.set('b', { n: 3 }, 40);

    expect(cache.get('a')).toEqual({ n: 2 });
    expect(cache.get('b')).toEqual({ n: 3 });
  });

  it('does not store a value larger than the budget', () => {
    const cache = lruCache({ maxBytes: 100 });
    const big = { rows: 1 };
    expect(cache.set('a', big, 101)).toBe(big);
    expect(cache.get('a')).toBeUndefined();
  });

  it('charges a shared owner once and releases it with the last entry', () => {
    const cache = lruCache({ maxBytes: 100 });
    const owner = {};
    cache.set('a', { a: 1 }, 80, owner);
    cache.set('b', { b: 2 }, 80, owner);
    cache.set('c', { c: 3 }, 80, owner);
    cache.set('d', { d: 4 }, 20);

    expect(cache.get('a')).toEqual({ a: 1 });
    expect(cache.get('b')).toEqual({ b: 2 });
    expect(cache.get('c')).toEqual({ c: 3 });
    expect(cache.get('d')).toEqual({ d: 4 });

    cache.set('e', { e: 5 }, 1);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
    expect(cache.get('d')).toEqual({ d: 4 });
    expect(cache.get('e')).toEqual({ e: 5 });
  });

  it('drops an entry older than the ttl on get', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const cache = lruCache({ ttl: 1000 });
    cache.set('a', { a: 1 }, 10);

    now = 1000;
    expect(cache.get('a')).toEqual({ a: 1 });
    now = 2001;
    expect(cache.get('a')).toBeUndefined();
  });
});
