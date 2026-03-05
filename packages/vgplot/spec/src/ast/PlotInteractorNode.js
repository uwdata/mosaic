import { ASTNode } from './ASTNode.js';
import { INTERACTOR, SELECT } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

export function parseInteractor(spec, ctx) {
  const { [SELECT]: name, ...options } = spec;
  if (!ctx.plot?.interactors?.has(name)) {
    ctx.error(`Unrecognized interactor type: ${name}`, spec);
  }
  return new PlotInteractorNode(name, parseOptions(options, ctx));
}

export class PlotInteractorNode extends ASTNode {
  constructor(name, options) {
    super(INTERACTOR);
    this.name = name;
    this.options = options;
  }

  instantiate(ctx) {
    return ctx.api[this.name](this.options.instantiate(ctx));
  }

  codegen(ctx) {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }

  toJSON() {
    const { name, options } = this;
    return { [SELECT]: name, ...options.toJSON() };
  }
}
