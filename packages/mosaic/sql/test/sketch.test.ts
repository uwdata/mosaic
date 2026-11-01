import { expect, describe, it } from 'vitest';
import { hllEstimate, hllSketch, hllUnion, kllQuantile, kllSketch, loadExtension } from '../src/index.js';

describe('Sketch functions', () => {
  it('include hll sketches', () => {
    expect(String(hllSketch('num1'))).toBe('datasketch_hll(12, "num1")');
    expect(String(hllSketch('num1', 16))).toBe('datasketch_hll(16, "num1")');
    expect(String(hllUnion('s'))).toBe('datasketch_hll_union(12, "s")');
    expect(String(hllUnion('s', 16))).toBe('datasketch_hll_union(16, "s")');
    expect(String(hllEstimate(hllSketch('num1'))))
      .toBe('datasketch_hll_estimate(datasketch_hll(12, "num1"))');
  });

  it('include kll sketches', () => {
    expect(String(kllSketch('num1'))).toBe('datasketch_kll(200, "num1")');
    expect(String(kllSketch('num1', 400))).toBe('datasketch_kll(400, "num1")');
    expect(String(kllQuantile('s', 0.5))).toBe('datasketch_kll_quantile("s", 0.5, TRUE)');
    expect(String(kllQuantile('s', 0.5, false))).toBe('datasketch_kll_quantile("s", 0.5, FALSE)');
  });

  it('are aggregate functions', () => {
    expect(hllSketch('num1').type).toBe('AGGREGATE');
    expect(hllUnion('s').type).toBe('AGGREGATE');
    expect(kllSketch('num1').type).toBe('AGGREGATE');
  });
});

describe('loadExtension', () => {
  it('installs from a repository', () => {
    expect(loadExtension('spatial')).toBe('INSTALL spatial; LOAD spatial');
    expect(loadExtension('datasketches', 'community'))
      .toBe('INSTALL datasketches FROM community; LOAD datasketches');
  });
});
