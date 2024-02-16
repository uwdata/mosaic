import { ASTNode } from './ASTNode.js';
import { INTERSECT, SELECTION } from '../constants.js';

export class SelectionNode extends ASTNode {
  constructor(select = INTERSECT, cross) {
    super(SELECTION);
    this.select = select;
    this.cross = cross;
  }

  instantiate(ctx) {
    const { select, cross } = this;
    return ctx.api.Selection[select]({ cross });
  }

  codegen(ctx) {
    const { select, cross } = this;
    const arg = cross != null ? `{ cross: ${cross} }` : '';
    return `${ctx.ns()}Selection.${select}(${arg})`;
  }

  toJSON() {
    const { select, cross } = this;
    return { select, cross };
  }
}
