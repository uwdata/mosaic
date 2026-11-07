import { isString } from '../util.js';
import { ParentNode } from './ASTNode.js';
import { PLOT } from '../constants.js';
import { parseAttribute } from './PlotAttributeNode.js';
import { parseInteractor } from './PlotInteractorNode.js';
import { parseLegend } from './PlotLegendNode.js';
import { parseMark } from './PlotMarkNode.js';
import type { PlotInteractorNode } from './PlotInteractorNode.js';
import type { PlotLegendNode } from './PlotLegendNode.js';
import type { PlotMarkNode } from './PlotMarkNode.js';
import type { PlotAttributeNode } from './PlotAttributeNode.js';
import type { ParseContext } from '../parse-spec.js';
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { Plot } from '../spec/Plot.js';
import type { Component } from '../spec/Spec.js';
import type { RootNode } from './SpecNode.js';

export function parseComponent(spec: Component, ctx: ParseContext): RootNode {
  return 'mark' in spec ? parsePlot({ plot: [spec] }, ctx): ctx.parseComponent(spec)
}

export function parsePlot(spec: Plot, ctx: ParseContext): PlotNode {
  const { [PLOT]: entries, ...attrs } = spec;
  const attributes = Object.entries(attrs)
    .map(([key, value]) => parseAttribute(key, value, ctx));

  const children = entries.map(spec => {
    return 'mark' in spec ? parseMark(spec, ctx)
      : 'legend' in spec ? parseLegend(spec, ctx)
        : isString(spec.select) ? parseInteractor(spec, ctx)
          : ctx.error('Invalid plot entry.', spec);
  });

  return new PlotNode(children, attributes);
}

export class PlotNode extends ParentNode<HTMLElement, Plot> {
  constructor(readonly children: (PlotMarkNode | PlotLegendNode | PlotInteractorNode)[], readonly attributes: PlotAttributeNode[] = []) {
    super(PLOT, children);
  }

  instantiate(ctx: InstantiateContext): HTMLElement {
    const attrs = [
      ...(ctx.plotDefaults),
      ...(this.attributes)
    ];
    return ctx.api[PLOT](
      ...this.children.map(c => c.instantiate(ctx)),
      ...attrs.map(a => a.instantiate(ctx))
    );
  }

  codegen(ctx: CodegenContext): string {
    const { type, children, attributes } = this;
    ctx.indent();
    const entries = [
      ...children.map(c => c.codegen(ctx)),
      ...(ctx.plotDefaults?.length ? [`${ctx.tab()}...defaultAttributes`] : []),
      ...attributes.map(a => a.codegen(ctx))
    ].join(',\n');
    ctx.undent();

    return `${ctx.tab()}${ctx.ns()}${type}(\n${entries}\n${ctx.tab()})`;
  }

  toJSON(): Plot {
    const { children, attributes } = this;
    const plot = { plot: children.map(c => c.toJSON()) };
    for (const a of attributes) {
      Object.assign(plot, a.toJSON());
    }
    return plot;
  }
}
