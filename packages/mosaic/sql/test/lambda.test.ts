import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { add, collectColumns, column, deepClone, eq, ExprNode, FunctionNode, isColumnRef, lambda, LambdaVarNode, list, literal, rewrite, upper } from '../src/index.js';

function fn(name: string, ...args: ExprNode[]) {
  return new FunctionNode(name, args);
}

describe('lambda', () => {
  it('generates lambda functions', async () => {
    const expr = fn('list_transform', column('lst1'), lambda('x', x => upper(x)));
    await expect(expr).toBeValidExpr('list_transform("lst1", lambda "x": upper("x"))');
    expect(columns(expr)).toStrictEqual(['lst1']);
  });

  it('supports multiple parameters', async () => {
    const expr = fn('list_reduce', column('lst1'), lambda(['acc', 'e'], (acc, e) => fn('concat', acc, e)));
    await expect(expr).toBeValidExpr('list_reduce("lst1", lambda "acc", "e": concat("acc", "e"))');
    expect(columns(expr)).toStrictEqual(['lst1']);
  });

  it('accepts a body with parameter references', async () => {
    const expr = fn('list_filter', column('lst1'), lambda('x', eq(new LambdaVarNode('x'), literal('a'))));
    await expect(expr).toBeValidExpr('list_filter("lst1", lambda "x": ("x" = \'a\'))');
  });

  it('collects free columns but not parameters', async () => {
    const expr = fn('list_filter', column('lst1'), lambda('x', x => eq(x, column('txt1'))));
    await expect(expr).toBeValidExpr('list_filter("lst1", lambda "x": ("x" = "txt1"))');
    expect(columns(expr)).toStrictEqual(['lst1', 'txt1']);
  });

  it('does not treat parameters that shadow columns as columns', async () => {
    const expr = fn('list_transform', list([1, 2]), lambda('num1', v => add(v, column('num1', 't1'))));
    await expect(expr).toBeValidExpr('list_transform([1, 2], lambda "num1": ("num1" + "t1"."num1"))');
    expect(collectColumns(expr).map(String)).toStrictEqual(['"t1"."num1"']);
  });

  it('supports nested lambdas that capture outer parameters', async () => {
    const expr = fn('list_transform', column('lst1'), lambda('x',
      x => fn('list_transform', column('lst2'), lambda('y', y => fn('concat', x, y)))
    ));
    await expect(expr).toBeValidExpr(
      'list_transform("lst1", lambda "x": list_transform("lst2", lambda "y": concat("x", "y")))'
    );
    expect(columns(expr)).toStrictEqual(['lst1', 'lst2']);
  });

  it('produces parameter references that are not column references', () => {
    lambda('x', x => {
      expect(isColumnRef(x)).toBe(false);
      return x;
    });
  });

  it('supports cloning and rewriting', () => {
    const txt = column('txt1');
    const expr = lambda('x', x => eq(x, txt));
    const clone = deepClone(expr);
    expect(clone).not.toBe(expr);
    expect(clone.body).not.toBe(expr.body);
    expect(`${clone}`).toBe(`${expr}`);
    const map = new Map([[txt, column('txt2')]]);
    expect(`${rewrite(expr, map)}`).toBe('lambda "x": ("x" = "txt2")');
  });
});
