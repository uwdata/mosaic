import { hconcat } from '@uwdata/vgplot';
import { ASTNode } from './ASTNode.js';
import { HCONCAT } from '../constants.js';

export function parseHConcat(spec, ctx) {
  const children = spec[HCONCAT].map(s => ctx.parseComponent(s));
  return new HConcatNode(children);
}

export class HConcatNode extends ASTNode {

  constructor(children) {
    super(HCONCAT, children);
  }

  instantiate(ctx) {
    return hconcat(this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx) {
    ctx.indent();
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }
}
