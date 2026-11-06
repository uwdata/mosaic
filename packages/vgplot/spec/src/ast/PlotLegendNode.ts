import { ASTNode } from './ASTNode.js';
import { LEGEND } from '../constants.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import type { ParseContext } from '../parse-spec.js';
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { PlotLegendName } from '../config/plots.js';
import type { PlotLegend } from '../spec/PlotLegend.js';
import type { colorLegend } from '@uwdata/vgplot'


export function parseLegend(spec: PlotLegend, ctx: ParseContext): PlotLegendNode {
  const { [LEGEND]: name, ...options } = spec;
  const key: PlotLegendName = `${name}Legend`;
  if (!ctx.plot.legends.has(key)) {
    ctx.error(`Unrecognized legend type: ${name}`, spec);
  }
  return new PlotLegendNode(key, name, parseOptions(options, ctx));
}

export class PlotLegendNode extends ASTNode<ReturnType<typeof colorLegend>, PlotLegend> {
  constructor(readonly key: PlotLegendName, readonly name: PlotLegend['legend'], readonly options: OptionsNode) {
    super(LEGEND);
  }

  instantiate(ctx: InstantiateContext): ReturnType<typeof colorLegend> {
    return ctx.api[this.key](this.options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.key}(${opt})`;
  }

  toJSON(): PlotLegend {
    const { name, options } = this;
    return { legend: name, ...options.toJSON() };
  }
}
