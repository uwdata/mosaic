import { Selection } from '@uwdata/mosaic-core';
import { ASTNode } from './ASTNode.js';
import { INTERSECT, SELECTION } from '../constants.js';

export class SelectionNode extends ASTNode {
  constructor(select = INTERSECT) {
    super(SELECTION);
    this.select = select;
  }

  instantiate(ctx) {
    return Selection[this.select]();
  }

  codegen(ctx) {
    return `${ctx.ns()}Selection.${this.select}()`;
  }
}
