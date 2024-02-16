import { ASTNode } from './ASTNode.js';
import { LITERAL } from '../constants.js';

export class LiteralNode extends ASTNode {
  constructor(value) {
    super(LITERAL);
    this.value = value;
  }

  instantiate() {
    return this.value;
  }

  codegen(ctx) {
    return ctx.stringify(this.value);
  }

  toJSON() {
    return this.value;
  }
}
