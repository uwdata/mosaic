import assert from 'node:assert';
import { stubParam } from './stub-param.js';
import { column, desc, isSQLExpression, isParamLike } from '../src/index.js';

describe('desc', () => {
  it('creates descending order annotations', () => {
    const expr = desc('foo');
    assert.ok(isSQLExpression(expr));
    assert.ok(!isParamLike(expr));
    assert.strictEqual(String(expr), '"foo" DESC NULLS LAST');
    assert.strictEqual(expr.column, 'foo');
    assert.deepStrictEqual(expr.columns, ['foo']);

    const param = stubParam(column('bar'));
    const expr2 = desc(param);
    assert.ok(isSQLExpression(expr2));
    assert.ok(isParamLike(expr2));
    assert.strictEqual(String(expr2), '"bar" DESC NULLS LAST');

    expr2.addEventListener('value', value => {
      assert.ok(isSQLExpression(value));
      assert.strictEqual(String(expr2), `${value}`);
    });
    param.update(column('baz'));
    assert.strictEqual(String(expr2), '"baz" DESC NULLS LAST');
  });
});
