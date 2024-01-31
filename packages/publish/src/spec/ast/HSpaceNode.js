import { hspace } from '@uwdata/vgplot';
import { ASTNode } from './ASTNode.js';
import { HSPACE } from '../constants.js';

export function parseHSpace(spec) {
  return new HSpaceNode(spec[HSPACE]);
}

export class HSpaceNode extends ASTNode {
  constructor(value) {
    super(HSPACE);
    this.value = value;
  }

  instantiate() {
    return hspace(this.value);
  }

  codegen(ctx) {
    return `${ctx.tab()}${ctx.ns()}${this.type}(${this.value})`;
  }
}
