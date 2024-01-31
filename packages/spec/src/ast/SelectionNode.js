import { ASTNode } from './ASTNode.js';
import { INTERSECT, SELECTION } from '../constants.js';

export class SelectionNode extends ASTNode {
  constructor(select = INTERSECT) {
    super(SELECTION);
    this.select = select;
  }

  instantiate(ctx) {
    return ctx.api.Selection[this.select]();
  }

  codegen(ctx) {
    return `${ctx.ns()}Selection.${this.select}()`;
  }

  toJSON() {
    return { select: this.select };
  }
}
