// oxlint-disable no-use-before-define
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

type Select = Selection['select'];

export function parseSelection(spec: Selection, ctx: ParseContext): SelectionNode {
  const { select, include, ...options } = spec;
  const opt = parseOptions(options, ctx);
  if (include) {
    opt.options.include = new IncludeNode(
      toArray(include).map((ref) => ctx.selectionRef(paramRef(ref))),
    );
  }
  return new SelectionNode(select, opt);
}

export class SelectionNode extends ASTNode<mc.Selection, string, Selection> {
  /** Create a Selection AST node. */
  readonly select: Select;
  readonly options: OptionsNode;
  constructor(select: Select = INTERSECT, options: OptionsNode = new OptionsNode({})) {
    super(SELECTION);
    this.select = select;
    this.options = options;
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

export class IncludeNode extends ASTNode<(mc.Param<unknown> | undefined)[]> {
  readonly refs: (ParamRefNode | null)[];
  constructor(refs: (ParamRefNode | null)[]) {
    super(INCLUDE);
    this.refs = refs;
  }

  instantiate(ctx: InstantiateContext): (mc.Param<unknown> | undefined)[] {
    // @ts-expect-error ref is possibly null
    return this.refs.map((ref) => ref.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    // @ts-expect-error ref is possibly null
    return `[${this.refs.map((ref) => ref.codegen(ctx)).join(', ')}]`;
  }

  toJSON(): ParamRef[] {
    // @ts-expect-error ref is possibly null
    return this.refs.map((ref) => ref.toJSON());
  }
}
