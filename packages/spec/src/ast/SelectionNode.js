import { ASTNode } from './ASTNode.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import { INCLUDE, INTERSECT, SELECTION } from '../constants.js';
import { paramRef, toArray } from '../util.js';

export function parseSelection(spec, ctx) {
  const { select, include, ...options } = spec;
  const opt = parseOptions(options, ctx);
  if (include) {
    opt.options.include = new IncludeNode(
      toArray(include).map(ref => ctx.selectionRef(paramRef(ref)))
    );
  }
  return new SelectionNode(select, opt);
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

export class IncludeNode extends ASTNode {
  constructor(refs) {
    super(INCLUDE);
    this.refs = refs;
  }

  instantiate(ctx) {
    return this.refs.map(ref => ref.instantiate(ctx));
  }

  codegen(ctx) {
    return `[${this.refs.map(ref => ref.codegen(ctx)).join(', ')}]`;
  }

  toJSON() {
    return this.refs.map(ref => ref.toJSON());
  }
}
