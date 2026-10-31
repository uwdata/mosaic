import type { CodegenContext } from '../ast-to-esm.js';
import { LITERAL } from '../constants.js';
import type { JSONValue } from '../spec/Data.js';
import { ASTNode } from './ASTNode.js';

export class LiteralNode<T extends JSONValue> extends ASTNode<T, T> {
  constructor(readonly value: T) {
    super(LITERAL);
  }

  instantiate(): T {
    return this.value;
  }

  codegen(ctx: CodegenContext): string {
    return ctx.stringify(this.value);
  }

  toJSON(): T {
    return this.value;
  }
}
