import { legendDirectives } from '@uwdata/vgplot';
import { ASTNode } from './ASTNode.js';
import { LEGEND } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

const legendMap = new Map(Object.entries(legendDirectives));

export function parseLegend(spec, ctx) {
  const { legend, ...options } = spec;
  const key = `${legend}Legend`;
  if (!legendMap.has(key)) {
    error(`Unrecognized legend type: ${legend}`, spec);
  }
  return new PlotLegendNode(key, parseOptions(options, ctx));
}

export class PlotLegendNode extends ASTNode {
  constructor(name, options) {
    super(LEGEND);
    this.name = name;
    this.options = options;
  }

  instantiate(ctx) {
    const fn = legendMap.get(this.name);
    return fn(this.options.instantiate(ctx));
  }

  codegen(ctx) {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }
}
