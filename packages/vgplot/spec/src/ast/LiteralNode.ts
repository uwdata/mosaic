import type { CodegenContext } from '../ast-to-esm.js';
import { LITERAL } from '../constants.js';
import type { JSONValue } from './ASTNode.js';
import { ASTNode } from './ASTNode.js';

export class LiteralNode<T extends JSONValue> extends ASTNode<T, string, T> {
  readonly value: T;
  constructor(value: T) {
    super(LITERAL);
    this.value = value;
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
