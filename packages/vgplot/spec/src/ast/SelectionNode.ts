import type * as mc from '@uwdata/mosaic-core';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { INCLUDE, INTERSECT, SELECTION } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { ParamRef, Selection } from '../spec/Param.js';
import { paramRef, toArray } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import type { ParamRefNode } from './ParamRefNode.js';

export class SelectionNode extends ASTNode<mc.Selection, Selection> {
  constructor(
    readonly select: Selection['select'] = INTERSECT,
    readonly options: OptionsNode = new OptionsNode({}),
  ) {
    super(SELECTION);
  }

  instantiate(ctx: InstantiateContext): mc.Selection {
    const { select, options } = this;
    return ctx.api.Selection[select](options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const { select, options } = this;
    return `${ctx.ns()}Selection.${select}(${options.codegen(ctx)})`;
  }

  toJSON(): Selection {
    const { select, options } = this;
    return { select, ...options.toJSON() };
  }
}

export class IncludeNode extends ASTNode {
  constructor(readonly refs: ParamRefNode[]) {
    super(INCLUDE);
  }

  instantiate(ctx: InstantiateContext): (mc.Param<unknown> | mc.Selection)[] {
    return this.refs.map((ref) => ref.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    return `[${this.refs.map((ref) => ref.codegen(ctx)).join(', ')}]`;
  }

  toJSON(): ParamRef[] {
    return this.refs.map((ref) => ref.toJSON());
  }
}

export function parseSelection(spec: Selection, ctx: ParseContext): SelectionNode {
  const { select, include, ...options } = spec;
  const opt = parseOptions(options, ctx);
  if (include) {
    const refs = toArray(include).map((ref) => ctx.selectionRef(paramRef(ref)));
    opt.options.include = new IncludeNode(refs);
  }
  return new SelectionNode(select, opt);
}
