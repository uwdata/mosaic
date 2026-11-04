import { isArray } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { FROM } from '../constants.js';
import { LiteralNode } from './LiteralNode.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import type { ParseContext } from '../parse-spec.js';
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { PlotDataInline, PlotFrom, PlotMarkData } from '../spec/PlotFrom.js';
import type { ParamRefNode } from './ParamRefNode.js';

type APIContext = InstantiateContext['api']

export function parseMarkData(spec: PlotMarkData, ctx: ParseContext): LiteralNode<PlotDataInline> | PlotFromNode | undefined {
  if (!spec) {
    // no data, likely a decoration mark
    return
  }

  if (isArray(spec)) {
    return new LiteralNode(spec);
  }

  const { from: table, ...options } = spec;
  return new PlotFromNode(ctx.maybeParam(table), parseOptions(options, ctx));
}

export class PlotFromNode extends ASTNode<ReturnType<APIContext['from']>, PlotFrom> {
  constructor(readonly table: ParamRefNode | LiteralNode<string>, readonly options: OptionsNode) {
    super(FROM);
  }

  instantiate(ctx: InstantiateContext): ReturnType<APIContext['from']> {
    const { table, options } = this;
    return ctx.api[FROM](table.instantiate(ctx), options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const table = this.table.codegen(ctx);
    const opt = this.options.codegen(ctx);
    return `${ctx.ns()}${this.type}(${table}${opt ? ', ' + opt : ''})`;
  }

  toJSON(): PlotFrom {
    const { table, options } = this;
    return { from: table.toJSON(), ...options.toJSON() };
  }
}
