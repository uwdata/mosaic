import { ASTNode } from './ASTNode.js';
import { ATTRIBUTE, FIXED, LITERAL } from '../constants.js';
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { ParseContext } from '../parse-spec.js';
import type { PlotAttributeName } from '../config/plots.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { LiteralNode } from './LiteralNode.js';

type AttrFunction = (plot: any) => void;

function ensureAttribute(key: any, value: any, ctx: ParseContext): asserts key is PlotAttributeName {
  if (!ctx.plot.attributes.has(key)) {
    ctx.error(`Unrecognized attribute: ${key}`, value);
  }
}
export function parseAttribute<N extends PlotAttributeName>(key: N, value: any, ctx: ParseContext): PlotAttributeNode<N>
export function parseAttribute(key: any, value: any, ctx: ParseContext): PlotAttributeNode
export function parseAttribute(key: any, value: any, ctx: ParseContext): PlotAttributeNode {
  ensureAttribute(key, value, ctx)
  return new PlotAttributeNode(
    key,
    value === FIXED ? new PlotFixedNode : ctx.maybeParam(value)
  );
}

export class PlotAttributeNode<N extends PlotAttributeName = any> extends ASTNode<AttrFunction, Record<N, any>> {
  constructor(readonly name: N, readonly value: PlotFixedNode | ParamRefNode | LiteralNode<any>) {
    super(ATTRIBUTE);
  }

  instantiate(ctx: InstantiateContext): AttrFunction {
    const { name, value } = this;
    return ctx.api[name](value.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const { name, value } = this;
    return `${ctx.tab()}${ctx.ns()}${name}(${value.codegen(ctx)})`;
  }

  toJSON(): Record<N, any> {
    const { name, value } = this;
    return { [name]: value.toJSON() } as Record<N, any>;
  }
}

export class PlotFixedNode extends ASTNode {
  constructor(readonly value: 'Fixed' = FIXED) {
    super(LITERAL);
  }

  instantiate(ctx: InstantiateContext): symbol {
    return ctx.api[FIXED];
  }

  codegen(ctx: CodegenContext): string {
    return `${ctx.ns()}${FIXED}`;
  }

  toJSON(): 'Fixed' {
    return this.value;
  }
}
