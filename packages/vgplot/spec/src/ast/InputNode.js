import { ASTNode } from './ASTNode.js';
import { INPUT } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

export function parseInput(spec, ctx) {
  const { [INPUT]: name, ...options } = spec;
  if (!ctx.inputs?.has(name)) {
    ctx.error(`Unrecognized input type: ${name}`, spec);
  }
  return new InputNode(name, parseOptions(options, ctx));
}

export class InputNode extends ASTNode {
  constructor(name, options) {
    super(INPUT);
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
    const { type, name, options } = this;
    return { [type]: name, ...options.toJSON() };
  }
}
