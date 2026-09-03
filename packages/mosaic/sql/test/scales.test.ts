import { expect, describe, it } from 'vitest';
import { scaleTransform } from '../src/index.js';

function transformExp(base: number) {
  return base === 10 ? (x: number) => Math.pow(10, x)
    : base === Math.E ? Math.exp
    : (x: number) => Math.pow(base, x);
}

function transformLog(base: number) {
  return base === Math.E ? Math.log
    : base === 10 && Math.log10
    || (base = Math.log(base), x => Math.log(x) / base);
}

function wrap(f: (x: number) => number) {
  return (x: number) => Math.sign(x) * f(Math.abs(x));
}

function transformSqrt(x: number) {
  return Math.sign(x) * Math.sqrt(Math.abs(x));
}

function transformSquare(x: number) {
  return Math.sign(x) * x * x;
}

function transformPow(e: number) {
  return (x: number) => Math.sign(x) * Math.pow(Math.abs(x), e);
}

function transformSymlog(c: number) {
  return (x: number) => Math.sign(x) * Math.log1p(Math.abs(x / c));
}

function transformSymexp(c: number) {
  return (x: number) => Math.sign(x) * Math.expm1(Math.abs(x)) * c;
}

describe('scaleTransform', () => {
  it('supports linear scale', () => {
    const values = [-100, -50, -25, -10, -5, 0, 5, 10, 25, 50, 100];
    const s = scaleTransform<number>({ type: 'linear' });
    for (const v of values) {
      expect(s.apply(v)).toBe(v);
      expect(s.invert(v)).toBe(v);
      expect(s.invert(s.apply(v))).toBe(v);
    }
  });

  it('supports log scale', () => {
    const values = [-100, -50, -25, -10, -5, 5, 10, 25, 50, 100];
    const bases = [2, Math.E, 10];
    for (const b of bases) {
      const s = scaleTransform<number>({ type: 'log', base: b });
      const f = wrap(transformLog(b));
      const i = wrap(transformExp(b));
      for (const v of values) {
        expect(s.apply(v)).toBeCloseTo(f(v), 9);
        expect(s.invert(v)).toBeCloseTo(i(v), 9);
        expect(s.invert(s.apply(v))).toBeCloseTo(v, 9);
      }
    }
  });

  it('supports sqrt scale', () => {
    const values = [-100, -50, -25, -10, -5, 0, 5, 10, 25, 50, 100];
    const s = scaleTransform<number>({ type: 'sqrt' });
    const f = transformSqrt;
    const i = transformSquare;
    for (const v of values) {
      expect(s.apply(v)).toBe(f(v));
      expect(s.invert(v)).toBe(i(v));
      expect(s.invert(s.apply(v))).toBeCloseTo(v, 9);
    }
  });

  it('supports pow scale', () => {
    const values = [-100, -50, -25, -10, -5, 0, 5, 10, 25, 50, 100];
    const exponents = [1, 1/3, 1/10];
    for (const e of exponents) {
      const s = scaleTransform<number>({ type: 'pow', exponent: e });
      const f = transformPow(e);
      const i = transformPow(1 / e);
      for (const v of values) {
        expect(s.apply(v)).toBe(f(v));
        expect(s.invert(v)).toBe(i(v));
        expect(s.invert(s.apply(v))).toBeCloseTo(v, 9);
      }
    }
  });

  it('supports symlog scale', () => {
    const values = [-100, -50, -25, -10, -5, 0, 5, 10, 25, 50, 100];
    const constants = [1, 2, 3];
    for (const c of constants) {
      const s = scaleTransform<number>({ type: 'symlog', constant: c });
      const f = transformSymlog(c);
      const i = transformSymexp(c);
      for (const v of values) {
        expect(s.apply(v)).toBe(f(v));
        expect(s.invert(v)).toBe(i(v));
        expect(s.invert(s.apply(v))).toBeCloseTo(v, 9);
      }
    }
  });
});