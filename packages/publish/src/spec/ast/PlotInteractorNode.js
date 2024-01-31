import { interactorDirectives } from '@uwdata/vgplot';
import { ASTNode } from './ASTNode.js';
import { INTERACTOR } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

const interactorMap = new Map(Object.entries(interactorDirectives));

export function parseInteractor(spec, ctx) {
  const { select, ...options } = spec;
  if (!interactorMap.has(select)) {
    ctx.error(`Unrecognized interactor type: ${select}`, spec);
  }
  return new PlotInteractorNode(select, parseOptions(options, ctx));
}

export class PlotInteractorNode extends ASTNode {
  constructor(name, options) {
    super(INTERACTOR);
    this.name = name;
    this.options = options;
  }

  instantiate(ctx) {
    const fn = interactorMap.get(this.name);
    return fn(this.options.instantiate(ctx));
  }

  codegen(ctx) {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }
}
