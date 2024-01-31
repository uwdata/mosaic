import { ASTNode } from './ASTNode.js';
import { DATAREF } from '../constants.js';

export class DataRefNode extends ASTNode {
  constructor(name) {
    super(DATAREF);
    this.name = name;
  }

  instantiate(ctx) {
    return ctx.activeData?.get(this.name);
  }

  codegen() {
    return this.name;
  }

  toJSON() {
    return this.name;
  }
}
