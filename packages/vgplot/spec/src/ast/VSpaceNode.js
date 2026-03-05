import { ASTNode } from './ASTNode.js';
import { VSPACE } from '../constants.js';

export function parseVSpace(spec) {
  return new VSpaceNode(spec[VSPACE]);
}

export class VSpaceNode extends ASTNode {
  constructor(value) {
    super(VSPACE);
    this.value = value;
  }

  instantiate(ctx) {
    return ctx.api[VSPACE](this.value);
  }

  codegen(ctx) {
    return `${ctx.tab()}${ctx.ns()}${this.type}(${ctx.stringify(this.value)})`;
  }

  toJSON() {
    return { [this.type]: this.value };
  }
}
