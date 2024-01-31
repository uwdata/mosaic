import { plot } from '@uwdata/vgplot';
import { isString } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { PLOT } from '../constants.js';
import { parseAttribute } from './PlotAttributeNode.js';
import { parseInteractor } from './PlotInteractorNode.js';
import { parseLegend } from './PlotLegendNode.js';
import { parseMark } from './PlotMarkNode.js';

export function parseTopLevelMark(spec, ctx) {
  return parsePlot({ plot: [ spec ] }, ctx);
}

export function parsePlot(spec, ctx) {
  const { [PLOT]: entries, ...attrs } = spec;
  const attributes = Object.entries(attrs)
    .map(([key, value]) => parseAttribute(key, value, ctx));

  const children = entries.map(spec => {
    return isString(spec.mark) ? parseMark(spec, ctx)
      : isString(spec.legend) ? parseLegend(spec, ctx)
      : isString(spec.select) ? parseInteractor(spec, ctx)
      : ctx.error(`Invalid plot entry.`, spec);
  });

  return new PlotNode(children, attributes);
}

export class PlotNode extends ASTNode {
  constructor(children, attributes) {
    super(PLOT, children);
    this.attributes = attributes;
  }

  instantiate(ctx) {
    const defaults = ctx.plotDefaults || [];
    return plot(
      this.children.map(c => c.instantiate(ctx)),
      defaults.concat(this.attributes.map(a => a.instantiate(ctx)))
    );
  }

  codegen(ctx) {
    const { type, children, attributes } = this;
    ctx.indent();
    const entries = [
      ...children.map(c => c.codegen(ctx)),
      ...(ctx.plotDefaults ? [`${ctx.tab()}...defaultAttributes`] : []),
      ...attributes.map(a => a.codegen(ctx))
    ].join(',\n');
    ctx.undent();

    return `${ctx.tab()}${ctx.ns()}${type}(\n${entries}\n${ctx.tab()})`;
  }
}
