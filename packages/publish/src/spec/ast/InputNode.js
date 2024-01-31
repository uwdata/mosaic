import { ASTNode } from './ASTNode.js';
import { INPUT } from '../constants.js';
import { parseOptions } from './OptionsNode.js';

export function parseInput(spec, ctx) {
  const { input, ...options } = spec;
  if (!ctx.inputs.has(input)) {
    ctx.error(`Unrecognized input: ${input}`, spec);
  }
  return new InputNode(input, parseOptions(options, ctx));
}

export class InputNode extends ASTNode {
  constructor(name, options) {
    super(INPUT);
    this.name = name;
    this.options = options;
  }

  instantiate(ctx) {
    const fn = ctx.inputs.get(this.name);
    return fn(this.options.instantiate(ctx));
  }

  codegen(ctx) {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }
}
