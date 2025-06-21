import { ASTNode } from './ASTNode.js';
import { COLUMPARAMREF } from '../constants.js';

export class ColumnParamRefNode extends ASTNode {
  constructor(param) {
    super(COLUMPARAMREF);
    this.param = param;
  }

  instantiate(ctx) {
    return ctx.api.column(this.param.instantiate(ctx));
  }

  codegen(ctx) {
    return `${ctx.ns()}column(${this.param.codegen(ctx)})`;
  }

  toJSON() {
    return `$${this.param.toJSON}`;
  }
}
