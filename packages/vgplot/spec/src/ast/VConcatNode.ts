import { ParentNode } from './ASTNode.js';
import { VCONCAT } from '../constants.js';
import { parseComponent } from './PlotNode.js';
import type { ParseContext } from '../parse-spec.js';
import type { VConcat } from '../spec/VConcat.js';
import type { RootNode } from './SpecNode.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { InstantiateContext } from '../ast-to-dom.js';

export function parseVConcat(spec: VConcat, ctx: ParseContext): VConcatNode {
  const children = spec[VCONCAT].map(s => parseComponent(s, ctx));
  return new VConcatNode(children);
}

export class VConcatNode extends ParentNode<HTMLDivElement, VConcat> {
  declare readonly children: RootNode[]
  constructor(children: RootNode[]) {
    super(VCONCAT, children);
  }

  instantiate(ctx: InstantiateContext): HTMLDivElement {
    return ctx.api[VCONCAT](...this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx: CodegenContext): string {
    ctx.indent();
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON(): VConcat {
    return { vconcat: this.children.map(c => c.toJSON()) };
  }
}
