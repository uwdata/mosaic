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

  const { [FROM]: table, ...options } = spec;
  if (ctx.datasets.has(table)) {
    // client-managed data, simply pass through
    return ctx.datasets.get(table);
  } else {
    // source-managed data, create from descriptor
    return new PlotFromNode(table, parseOptions(options, ctx));
  }
}

export class PlotFromNode extends ASTNode {
  constructor(table, options) {
    super(FROM);
    this.table = table;
    this.options = options;
  }

  instantiate(ctx) {
    const { table, options } = this;
    return ctx.api[FROM](table, options.instantiate(ctx));
  }

  codegen(ctx) {
    const { type, table, options } = this;
    const opt = options.codegen(ctx);
    return `${ctx.ns()}${type}("${table}"${opt ? ', ' + opt : ''})`;
  }

  toJSON() {
    const { type, table, options } = this;
    return { [type]: table, ...options.toJSON() };
  }
}
