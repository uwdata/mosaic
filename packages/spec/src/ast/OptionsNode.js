import { ASTNode } from './ASTNode.js';
import { OPTIONS } from '../constants.js';

export function parseOptions(spec, ctx) {
  const options = {};
  for (const key in spec) {
    options[key] = ctx.maybeSelection(spec[key]);
  }
  return new OptionsNode(options);
}

export class OptionsNode extends ASTNode {
  constructor(options) {
    super(OPTIONS);
    this.options = options;
  }

  instantiate(ctx) {
    const { options } = this;
    const opt = {};
    for (const key in options) {
      opt[key] = options[key].instantiate(ctx);
    }
    return opt;
  }

  codegen(ctx) {
    const { options } = this;
    const opt = [];
    for (const key in options) {
      opt.push(`${key}: ${options[key].codegen(ctx)}`);
    }
    return opt.length ? `{${ctx.maybeLineWrap(opt)}}` : '';
  }

  toJSON() {
    const { options } = this;
    const opt = {};
    for (const key in options) {
      opt[key] = options[key].toJSON();
    }
    return opt;
  }
}
