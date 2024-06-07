import { ASTNode } from './ASTNode.js';
import { INTERSECT, SELECTION } from '../constants.js';

export class SelectionNode extends ASTNode {
  constructor(select = INTERSECT, cross, empty) {
    super(SELECTION);
    this.select = select;
    this.cross = cross;
    this.empty = empty;
  }

  instantiate(ctx) {
    const { select, cross, empty } = this;
    return ctx.api.Selection[select]({ cross, empty });
  }

  codegen(ctx) {
    const { select, cross, empty } = this;
    const args = [['cross', cross], ['empty', empty]]
      .filter(a => a[1] != null)
      .map(a => `${a[0]}: ${a[1]}`);
    const arg = args.length ? `{ ${args.join(', ')} }` : '';
    return `${ctx.ns()}Selection.${select}(${arg})`;
  }

  toJSON() {
    const { select, cross, empty } = this;
    return { select, cross, empty };
  }
}
