import { isArray } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { FROM } from '../constants.js';
import { LiteralNode } from './LiteralNode.js';
import { parseOptions } from './OptionsNode.js';

export function parseMarkData(spec, ctx) {
  if (!spec) {
    // no data, likely a decoration mark
    return null;
  }

  if (isArray(spec)) {
    // data provided directly, treat as JSON literal
    return new LiteralNode(spec);
  }

  const { from: table, ...options } = spec;
  return new PlotFromNode(ctx.maybeParam(table), parseOptions(options, ctx));
}

export class PlotFromNode extends ASTNode {
  constructor(table, options) {
    super(FROM);
    this.table = table;
    this.options = options;
  }

  instantiate(ctx) {
    const { table, options } = this;
    return ctx.api[FROM](table.instantiate(ctx), options.instantiate(ctx));
  }

  codegen(ctx) {
    const table = this.table.codegen(ctx);
    const opt = this.options.codegen(ctx);
    return `${ctx.ns()}${this.type}(${table}${opt ? ', ' + opt : ''})`;
  }

  toJSON() {
    const { type, table, options } = this;
    return { [type]: table.toJSON(), ...options.toJSON() };
  }
}
