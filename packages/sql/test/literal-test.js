import assert from 'node:assert';
import { literal } from '../src/index.js';

describe('literal', () => {
  it('handles booleans', () => {
    const trueExpr = literal(true);
    assert.strictEqual(trueExpr.value, true);
    assert.strictEqual(String(trueExpr), `TRUE`);

    const falseExpr = literal(false);
    assert.strictEqual(falseExpr.value, false);
    assert.strictEqual(String(falseExpr), `FALSE`);
  });
  it('handles dates', () => {
    const date = new Date('2012-01-01');
    const dateExpr = literal(date);
    assert.strictEqual(dateExpr.value, date);
    assert.strictEqual(String(dateExpr), 'MAKE_DATE(2012, 1, 1)');

    const timestamp = new Date('2012-01-01T17:51:12.833Z');
    const timestampExpr = literal(timestamp);
    assert.strictEqual(timestampExpr.value, timestamp);
    assert.strictEqual(String(timestampExpr), `EPOCH_MS(${+timestamp})`);

    const badDate = new Date('foobar');
    const badDateExpr = literal(badDate);
    assert.strictEqual(badDateExpr.value, badDate);
    assert.strictEqual(String(badDateExpr), 'NULL');
  });
  it('handles nulls', () => {
    const nullExpr = literal(null);
    assert.strictEqual(nullExpr.value, null);
    assert.strictEqual(String(nullExpr), `NULL`);

    const undefinedExpr = literal(undefined);
    assert.strictEqual(undefinedExpr.value, undefined);
    assert.strictEqual(String(undefinedExpr), `NULL`);
  });
  it('handles numbers', () => {
    const numberExpr = literal(1);
    assert.strictEqual(numberExpr.value, 1);
    assert.strictEqual(String(numberExpr), `1`);

    const nanExpr = literal(NaN);
    assert.strictEqual(nanExpr.value, NaN);
    assert.strictEqual(String(nanExpr), `NULL`);

    const infinityExpr = literal(Infinity);
    assert.strictEqual(infinityExpr.value, Infinity);
    assert.strictEqual(String(infinityExpr), `NULL`);
  });
  it('handles strings', () => {
    const stringExpr = literal('str');
    assert.strictEqual(stringExpr.value, 'str');
    assert.strictEqual(String(stringExpr), `'str'`);

    const emptyExpr = literal('');
    assert.strictEqual(emptyExpr.value, '');
    assert.strictEqual(String(emptyExpr), `''`);

    const stringWithQuotes = literal(`don't`);
    assert.strictEqual(stringWithQuotes.value, `don't`);
    assert.strictEqual(String(stringWithQuotes), `'don''t'`);
  });
});
