import { ASTNode } from './ASTNode.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import { INTERSECT, SELECTION } from '../constants.js';

export function parseSelection(spec, ctx) {
  const { select, ...options } = spec;
  return new SelectionNode(select, parseOptions(options, ctx));
}

export class SelectionNode extends ASTNode {
  /**
   * Create a Selection AST node.
   * @param {string} select The selection type.
   * @param {OptionsNode} options Selection options.
   */
  constructor(select = INTERSECT, options = new OptionsNode({})) {
    super(SELECTION);
    this.select = select;
    this.options = options;
  }

  instantiate(ctx) {
    const { select, options } = this;
    return ctx.api.Selection[select](options.instantiate(ctx));
  }

  codegen(ctx) {
    const { select, options } = this;
    return `${ctx.ns()}Selection.${select}(${options.codegen(ctx)})`;
  }

  toJSON() {
    const { select, options } = this;
    return { select, ...options.toJSON() };
  }
}
