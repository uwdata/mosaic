import { ASTNode } from './ASTNode.js';
import { PARAMREF } from '../constants.js';
import { toParamRef } from '../util.js';

export class ParamRefNode extends ASTNode {
  constructor(name) {
    super(PARAMREF);
    this.name = name;
  }

  instantiate(ctx) {
    return ctx.activeParams?.get(this.name);
  }

  codegen(ctx) {  
    return toParamRef(this.name);
  }

  toJSON() {
    return toParamRef(this.name);
  }
}
