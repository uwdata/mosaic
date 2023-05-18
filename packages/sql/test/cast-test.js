import assert from 'node:assert';
import { avg, cast, castDouble, castInteger, column } from '../src/index.js';

describe('cast', () => {
  it('performs type casts', () => {
    assert.strictEqual(String(cast('foo', 'DOUBLE')), 'CAST("foo" AS DOUBLE)');
    assert.strictEqual(String(cast(column('foo'), 'DOUBLE')), 'CAST("foo" AS DOUBLE)');

    const expr = cast(avg('bar'), 'DOUBLE');
    assert.strictEqual(String(expr), 'CAST(AVG("bar") AS DOUBLE)');
    assert.strictEqual(expr.aggregate, 'AVG');
    assert.strictEqual(expr.column, 'bar');
    assert.deepStrictEqual(expr.columns, ['bar']);
    assert.strictEqual(expr.label, 'avg(bar)');
  });
  it('performs double casts', () => {
    assert.strictEqual(String(castDouble('foo')), 'CAST("foo" AS DOUBLE)');
    assert.strictEqual(String(castDouble(column('foo'))), 'CAST("foo" AS DOUBLE)');

    const expr = castDouble(avg('bar'));
    assert.strictEqual(String(expr), 'CAST(AVG("bar") AS DOUBLE)');
    assert.strictEqual(expr.aggregate, 'AVG');
    assert.strictEqual(expr.column, 'bar');
    assert.deepStrictEqual(expr.columns, ['bar']);
    assert.strictEqual(expr.label, 'avg(bar)');
  });
  it('performs integer casts', () => {
    assert.strictEqual(String(castInteger('foo')), 'CAST("foo" AS INTEGER)');
    assert.strictEqual(String(castInteger(column('foo'))), 'CAST("foo" AS INTEGER)');

    const expr = castInteger(avg('bar'));
    assert.strictEqual(String(expr), 'CAST(AVG("bar") AS INTEGER)');
    assert.strictEqual(expr.aggregate, 'AVG');
    assert.strictEqual(expr.column, 'bar');
    assert.deepStrictEqual(expr.columns, ['bar']);
    assert.strictEqual(expr.label, 'avg(bar)');
  });
});
