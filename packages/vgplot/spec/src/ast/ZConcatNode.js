import { ASTNode } from './ASTNode.js';
import { ZCONCAT } from '../constants.js';

export function parseZConcat(spec, ctx) {
  const children = spec[ZCONCAT].map(s => ctx.parseComponent(s));
  return new ZConcatNode(children, spec.halign, spec.valign);
}

export class ZConcatNode extends ASTNode {
  /**
   * @param {ASTNode[]} children The layered components, bottom to top.
   * @param {number} [halign] Horizontal alignment in [0, 1].
   * @param {number} [valign] Vertical alignment in [0, 1].
   */
  constructor(children, halign, valign) {
    super(ZCONCAT, children);
    this.halign = halign;
    this.valign = valign;
  }

  /** The alignment options that were specified. */
  options() {
    const { halign, valign } = this;
    return {
      ...(halign !== undefined && { halign }),
      ...(valign !== undefined && { valign })
    };
  }

  instantiate(ctx) {
    const children = this.children.map(c => c.instantiate(ctx));
    const options = this.options();
    return Object.keys(options).length
      ? ctx.api[ZCONCAT](options, children)
      : ctx.api[ZCONCAT](children);
  }

  codegen(ctx) {
    ctx.indent();
    const options = this.options();
    const items = [
      ...(Object.keys(options).length ? [`${ctx.tab()}${ctx.stringify(options)}`] : []),
      ...this.children.map(c => c.codegen(ctx))
    ];
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON() {
    return { [this.type]: this.children.map(c => c.toJSON()), ...this.options() };
  }
}
