import { agg, sql } from '@uwdata/mosaic-sql';
import { AGG, EXPR, EXPRESSION } from '../constants.js';
import { ASTNode } from './ASTNode.js';

export function parseExpression(spec, ctx) {
  const { label } = spec;
  const key = spec[EXPR] ? EXPR
    : spec[AGG] ? AGG
    : ctx.error('Unrecognized expression type', spec);

  const expr = spec[key];
  const tokens = expr.split(/(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$\w+)/g);
  const spans = [''];
  const exprs = [];

  for (let i = 0, k = 0; i < tokens.length; ++i) {
    const tok = tokens[i];
    if (tok.startsWith('$')) {
      exprs[k] = ctx.maybeParam(tok);
      spans[++k] = '';
    } else {
      spans[k] += tok;
    }
  }

  return new ExpressionNode(expr, spans, exprs, label, key === AGG);
}

export class ExpressionNode extends ASTNode {
  constructor(value, spans, exprs, label, aggregate) {
    super(EXPRESSION);
    this.value = value;
    this.spans = spans;
    this.exprs = exprs;
    this.label = label;
    this.aggregate = aggregate;
  }

  instantiate(ctx) {
    const { spans, exprs, label, aggregate } = this;
    const tag = aggregate ? agg : sql;
    const args = exprs.map(e => e.instantiate(ctx));
    return tag(spans, ...args).annotate({ label });
  }

  codegen(ctx) {
    const { spans, exprs, label, aggregate } = this;
    const method = aggregate ? 'agg' : 'sql';

    // reconstitute expression string
    let str = '';
    const n = exprs.length;
    for (let i = 0; i < n; ++i) {
      str += spans[i] + exprs[i].codegen(ctx);
    }
    str += spans[n + 1];

    return `${ctx.ns()}${method}\`${str}\``
      + (label ? `.annotate({ label: ${JSON.stringify(label)} })` : '');
  }
}
