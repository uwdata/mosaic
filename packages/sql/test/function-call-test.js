import assert from 'node:assert';
import {
  contains, isFinite, isInfinite, isNaN, literal, length,
  lower, prefix, regexp_matches, suffix, upper
} from '../src/index.js';

// export const regexp_matches = func('REGEXP_MATCHES');
// export const contains = func('CONTAINS');
// export const prefix = func('PREFIX');
// export const suffix = func('SUFFIX');
// export const lower = func('LOWER');
// export const upper = func('UPPER');
// export const length = func('LENGTH');
// export const isNaN = func('ISNAN');
// export const isFinite = func('ISFINITE');
// export const isInfinite = func('ISINF');

describe('Function calls', () => {
  it('includes REGEXP_MATCHES', () => {
    const expr = regexp_matches('foo', literal('(an)*'))
    assert.strictEqual(String(expr), `REGEXP_MATCHES("foo", '(an)*')`);
    assert.strictEqual(expr.func, 'REGEXP_MATCHES');
    assert.strictEqual(expr.args.length, 2);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes CONTAINS', () => {
    const expr = contains('foo', literal('oo'))
    assert.strictEqual(String(expr), `CONTAINS("foo", 'oo')`);
    assert.strictEqual(expr.func, 'CONTAINS');
    assert.strictEqual(expr.args.length, 2);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes PREFIX', () => {
    const expr = prefix('foo', literal('fo'))
    assert.strictEqual(String(expr), `PREFIX("foo", 'fo')`);
    assert.strictEqual(expr.func, 'PREFIX');
    assert.strictEqual(expr.args.length, 2);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes SUFFIX', () => {
    const expr = suffix('foo', literal('oo'))
    assert.strictEqual(String(expr), `SUFFIX("foo", 'oo')`);
    assert.strictEqual(expr.func, 'SUFFIX');
    assert.strictEqual(expr.args.length, 2);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes LOWER', () => {
    const expr = lower('foo')
    assert.strictEqual(String(expr), `LOWER("foo")`);
    assert.strictEqual(expr.func, 'LOWER');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes UPPER', () => {
    const expr = upper('foo')
    assert.strictEqual(String(expr), `UPPER("foo")`);
    assert.strictEqual(expr.func, 'UPPER');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes LENGTH', () => {
    const expr = length('foo')
    assert.strictEqual(String(expr), `LENGTH("foo")`);
    assert.strictEqual(expr.func, 'LENGTH');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes ISNAN', () => {
    const expr = isNaN('foo')
    assert.strictEqual(String(expr), `ISNAN("foo")`);
    assert.strictEqual(expr.func, 'ISNAN');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes ISFINITE', () => {
    const expr = isFinite('foo')
    assert.strictEqual(String(expr), `ISFINITE("foo")`);
    assert.strictEqual(expr.func, 'ISFINITE');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('includes ISINF', () => {
    const expr = isInfinite('foo')
    assert.strictEqual(String(expr), `ISINF("foo")`);
    assert.strictEqual(expr.func, 'ISINF');
    assert.strictEqual(expr.args.length, 1);
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
});
