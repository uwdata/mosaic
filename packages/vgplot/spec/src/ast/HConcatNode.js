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
    // @ts-expect-error `children is possibly null
    return ctx.api[HCONCAT](this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx) {
    ctx.indent();
    // @ts-expect-error `children is possibly null
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON() {
    // @ts-expect-error `children is possibly null
    return { [this.type]: this.children.map(c => c.toJSON()) };
  }
}
