import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { deepClone, FunctionNode, literal, namedArg } from '../src/index.js';

describe('namedArg', () => {
  it('generates named function arguments', async () => {
    const expr = new FunctionNode('struct_pack', [
      namedArg('a', 'num1'),
      namedArg('b c', literal('x'))
    ]);
    await expect(expr).toBeValidExpr('struct_pack("a" := "num1", "b c" := \'x\')');
    expect(columns(expr)).toStrictEqual(['num1']);
  });

  it('supports cloning', () => {
    const arg = namedArg('a', 'num1');
    const clone = deepClone(arg);
    expect(clone).not.toBe(arg);
    expect(clone.expr).not.toBe(arg.expr);
    expect(`${clone}`).toBe('"a" := "num1"');
  });
});
