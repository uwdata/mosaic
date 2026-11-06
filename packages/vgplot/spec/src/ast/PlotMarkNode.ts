import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { PlotMarkName } from '../config/plots.js';
import { MARK } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { PlotDataInline } from '../spec/PlotFrom.js';
import type { PlotMark } from '../spec/PlotMark.js';
import { ASTNode } from './ASTNode.js';
import { LiteralNode } from './LiteralNode.js';
import { OptionsNode } from './OptionsNode.js';
import { parseMarkData, PlotFromNode } from './PlotFromNode.js';
import { maybeTransform } from './TransformNode.js';

export function parseMark(spec: PlotMark, ctx: ParseContext): PlotMarkNode {
  //@ts-expect-error Property 'data' does not exist on type 'PlotMark'
  const { mark, data, ...options } = spec;
  if (!ctx.plot.marks.has(mark)) {
    ctx.error(`Unrecognized mark type: ${mark}`, spec);
  }

  const input = parseMarkData(data, ctx);

  const opt: Record<string, ASTNode<any, any>> = {};
  for (const key in options) {
    const value = options[key];
    opt[key] = maybeTransform(value, ctx) || ctx.maybeParam(value);
  }

  return new PlotMarkNode(mark, input, new OptionsNode(opt));
}

export class PlotMarkNode extends ASTNode<(plot: any) => void, PlotMark> {
  constructor(readonly name: PlotMarkName, readonly data: LiteralNode<PlotDataInline> | PlotFromNode | undefined, readonly options: OptionsNode) {
    super(MARK);
  }

  instantiate(ctx: InstantiateContext): (plot: any) => void {
    const { name, data, options } = this;
    const opt = options.instantiate(ctx);
    return data
      ? ctx.api[name](data.instantiate(ctx), opt)
      : ctx.api[name](opt);
  }

  codegen(ctx: CodegenContext): string {
    const { name, data, options } = this;
    const d = data ? data.codegen(ctx) : '';
    const o = options.codegen(ctx);

    let arg: string;
    if (d && o) {
      ctx.indent();
      const opt = options.codegen(ctx);
      arg = `\n${ctx.tab()}${d},\n${ctx.tab()}${opt}\n`;
      ctx.undent();
      arg += ctx.tab();
    } else {
      arg = `${d}${o}`;
    }
    return `${ctx.tab()}${ctx.ns()}${name}(${arg})`;
  }

  toJSON(): PlotMark {
    const { name, data, options } = this;
    //@ts-expect-error `data` is a mix of required/optional/unsupported
    return {
      mark: name,
      ...(data ? { data: data.toJSON() } : {}),
      ...options.toJSON()
    };
  }
}
