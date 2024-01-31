import { ASTNode } from './ASTNode.js';
import { LEGEND } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

export function parseLegend(spec, ctx) {
  const { [LEGEND]: name, ...options } = spec;
  const key = `${name}Legend`;
  if (!ctx.plot?.legends?.has(key)) {
    ctx.error(`Unrecognized legend type: ${name}`, spec);
  }
  return new PlotLegendNode(key, name, parseOptions(options, ctx));
}

export class PlotLegendNode extends ASTNode {
  constructor(key, name, options) {
    super(LEGEND);
    this.key = key;
    this.name = name;
    this.options = options;
  }

  instantiate(ctx) {
    const fn = ctx.api[this.key];
    return fn(this.options.instantiate(ctx));
  }

  codegen(ctx) {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.key}(${opt})`;
  }

  toJSON() {
    const { type, name, options } = this;
    return { [type]: name, ...options.toJSON() };
  }
}
