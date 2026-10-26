import { ASTNode } from './ASTNode.js';
import { VCONCAT } from '../constants.js';

export function parseVConcat(spec, ctx) {
  const children = spec[VCONCAT].map(s => ctx.parseComponent(s));
  return new VConcatNode(children);
}

export class VConcatNode extends ASTNode {
  constructor(children) {
    super(VCONCAT, children);
  }

  instantiate(ctx) {
    // @ts-expect-error `this` is possibly null
    return ctx.api[VCONCAT](this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx) {
    ctx.indent();
    // @ts-expect-error `this` is possibly null
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON() {
    // @ts-expect-error `this` is possibly null
    return { [this.type]: this.children.map(c => c.toJSON()) };
  }
}
