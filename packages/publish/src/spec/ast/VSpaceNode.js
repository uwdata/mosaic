import { vspace } from '@uwdata/vgplot';
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

  instantiate() {
    return vspace(this.value);
  }

  codegen(ctx) {
    return `${ctx.tab()}${ctx.ns()}${this.type}(${this.value})`;
  }
}
