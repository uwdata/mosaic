import { MARK } from '../constants.js';
import { isArray, isObject } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { DataRefNode } from './DataRefNode.js';
import { parseExpression } from './ExpressionNode.js';
import { LiteralNode } from './LiteralNode.js';
import { OptionsNode, parseOptions } from './OptionsNode.js';
import { PlotFromNode } from './PlotFromNode.js';
import { parseTransform } from './TransformNode.js';

function maybeTransform(value, ctx) {
  if (isObject(value)) {
    return (value.expr || value.agg)
      ? parseExpression(value, ctx)
      : parseTransform(value, ctx);
  }
}

export function parseMark(spec, ctx) {
  const { mark, data, ...options } = spec;
  if (!ctx.plot?.marks?.has(mark)) {
    ctx.error(`Unrecognized mark type: ${mark}`, spec);
  }

  const input = parseMarkData(data, ctx);

  const opt = {};
  for (const key in options) {
    const value = options[key];
    opt[key] = maybeTransform(value, ctx) || ctx.maybeParam(value);
  }

  return new PlotMarkNode(mark, input, new OptionsNode(opt));
}

function parseMarkData(spec, ctx) {
  if (!spec) {
    // no data, likely a decoration mark
    return null;
  }

  if (isArray(spec)) {
    // data provided directly, treat as JSON literal
    return new LiteralNode(spec);
  }

  const { from: table, ...options } = spec;
  if (ctx.datasets.get(table)?.client) {
    // client-managed data, simply pass identifier
    return new DataRefNode(table);
  } else {
    // source-managed data, create from descriptor
    return new PlotFromNode(table, parseOptions(options, ctx));
  }
}

export class PlotMarkNode extends ASTNode {
  constructor(name, data, options) {
    super(MARK);
    this.name = name;
    this.data = data;
    this.options = options;
  }

  instantiate(ctx) {
    const { name, data, options } = this;
    const fn = ctx.api[name];
    const opt = options.instantiate(ctx);
    return data ? fn(data.instantiate(ctx), opt) : fn(opt);
  }

  codegen(ctx) {
    const { name, data, options } = this;
    const d = data ? data.codegen(ctx) : '';
    const o = options.codegen(ctx);

    let arg;
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

  toJSON() {
    const { type, name, data, options } = this;
    return {
      [type]: name,
      ...(data ? { data: data.toJSON() } : {}),
      ...options.toJSON()
    };
  }
}
