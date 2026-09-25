import { ASTNode } from './ASTNode.js';
import { ZCONCAT } from '../constants.js';

export function parseZConcat(spec, ctx) {
  const children = spec[ZCONCAT].map(s => ctx.parseComponent(s));
  return new ZConcatNode(children);
}

export class ZConcatNode extends ASTNode {
  constructor(children) {
    super(ZCONCAT, children);
  }

  instantiate(ctx) {
    return ctx.api[ZCONCAT](this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx) {
    ctx.indent();
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON() {
    return { [this.type]: this.children.map(c => c.toJSON()) };
  }
}
