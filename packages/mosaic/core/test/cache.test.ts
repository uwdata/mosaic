import { describe, it, expect, vi, afterEach } from 'vitest';
import { jsonByteLength, lruCache } from '../src/util/cache.js';

function mockTime() {
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  return (ms: number) => { now += ms; };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lruCache', () => {
  it('evicts the least recently used entry when the budget is exceeded', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { a: 1 }, 40);
    cache.set('b', { b: 2 }, 40);
    cache.set('c', { c: 3 }, 40);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toEqual({ b: 2 });
    expect(cache.get('c')).toEqual({ c: 3 });
  });

  it('refreshes recency on get', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { a: 1 }, 40);
    cache.set('b', { b: 2 }, 40);
    cache.get('a');
    cache.set('c', { c: 3 }, 40);

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toEqual({ a: 1 });
    expect(cache.get('c')).toEqual({ c: 3 });
  });

  it('replaces the charge when an existing key is set again', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { n: 1 }, 60);
    cache.set('a', { n: 2 }, 60);
    cache.set('b', { n: 3 }, 40);

    expect(cache.get('a')).toEqual({ n: 2 });
    expect(cache.get('b')).toEqual({ n: 3 });
  });

  it('charges once when a promise placeholder is replaced by data', () => {
    const cache = lruCache({ maxBytes: 100 });
    const promise = Promise.resolve('data');
    cache.set('a', promise);
    const data = { rows: 1 };
    cache.set('a', data, 60);
    cache.set('b', { b: 2 }, 40);

    expect(cache.get('a')).toBe(data);
    expect(cache.get('b')).toEqual({ b: 2 });
  });

  it('does not store a value larger than the budget and drops the placeholder', () => {
    const cache = lruCache({ maxBytes: 100 });
    const promise = Promise.resolve('data');
    cache.set('a', promise);
    expect(cache.get('a')).toBe(promise);

    const big = { rows: 1 };
    expect(cache.set('a', big, 101)).toBe(big);
    expect(cache.get('a')).toBeUndefined();
  });

  it('charges a shared owner once and releases it with the last entry', () => {
    const cache = lruCache({ maxBytes: 100 });
    const owner = { buffer: true };
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

  it('shares a charge between keys holding the same object value', () => {
    const cache = lruCache({ maxBytes: 100 });
    const value = { shared: true };
    cache.set('a', value, 60);
    cache.set('b', value, 60);

    expect(cache.get('a')).toBe(value);
    expect(cache.get('b')).toBe(value);
  });

  it('charges a primitive value against the budget', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', 'a', 60);
    cache.set('b', 'b', 60);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('b');
  });

  it('drops an entry older than the ttl on get', () => {
    const advance = mockTime();
    const cache = lruCache({ maxBytes: 100, ttl: 1000 });
    cache.set('a', { a: 1 }, 10);
    cache.set('b', { b: 2 }, 10);
    advance(500);
    expect(cache.get('b')).toEqual({ b: 2 });

    advance(501);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toEqual({ b: 2 });
  });

  it('empties the cache and restores the full budget on clear', () => {
    const cache = lruCache({ maxBytes: 100 });
    cache.set('a', { a: 1 }, 100);
    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    cache.set('b', { b: 2 }, 100);
    expect(cache.get('b')).toEqual({ b: 2 });
  });
});

describe('jsonByteLength', () => {
  it('returns zero for nullish values', () => {
    expect(jsonByteLength(undefined)).toBe(0);
    expect(jsonByteLength(null)).toBe(0);
  });

  it('returns the stringified length for an array of objects', () => {
    const rows = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
    expect(jsonByteLength(rows)).toBe(JSON.stringify(rows).length);
  });

  it('returns zero for values that can not be serialized', () => {
    expect(jsonByteLength([{ n: 1n }])).toBe(0);
  });
});
