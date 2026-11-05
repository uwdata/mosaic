import { ParentNode } from './ASTNode.js';
import { HCONCAT } from '../constants.js';
import { parseComponent } from './PlotNode.js';
import type { ParseContext } from '../parse-spec.js';
import type { HConcat } from '../spec/HConcat.js';
import type { RootNode } from './SpecNode.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { InstantiateContext } from '../ast-to-dom.js';

export function parseHConcat(spec: HConcat, ctx: ParseContext): HConcatNode {
  const children = spec[HCONCAT].map(s => parseComponent(s, ctx));
  return new HConcatNode(children);
}

export class HConcatNode extends ParentNode<HTMLDivElement, HConcat> {
  declare readonly children: RootNode[]
  constructor(children: RootNode[]) {
    super(HCONCAT, children);
  }

  instantiate(ctx: InstantiateContext): HTMLDivElement {
    return ctx.api[HCONCAT](this.children.map(c => c.instantiate(ctx)));
  }

  codegen(ctx: CodegenContext): string {
    ctx.indent();
    const items = this.children.map(c => c.codegen(ctx));
    ctx.undent();
    return `${ctx.tab()}${ctx.ns()}${this.type}(\n${items.join(',\n')}\n${ctx.tab()})`;
  }

  toJSON(): HConcat {
    return { hconcat: this.children.map(c => c.toJSON()) };
  }
}
