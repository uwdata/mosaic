import { AGG, EXPRESSION, SQL } from '../constants.js';
import { ASTNode } from './ASTNode.js';

export function parseExpression(spec, ctx) {
  const { label } = spec;
  const key = spec[SQL] ? SQL
    : spec[AGG] ? AGG
    : ctx.error('Unrecognized expression type', spec);

  const expr = spec[key];
  const tokens = expr.split(/(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$\w+)/g);
  const spans = [''];
  const params = [];

  for (let i = 0, k = 0; i < tokens.length; ++i) {
    const tok = tokens[i];
    if (tok.startsWith('$')) {
      params[k] = ctx.maybeParam(tok);
      spans[++k] = '';
    } else {
      spans[k] += tok;
    }
  }

  return new ExpressionNode(expr, spans, params, label, key === AGG);
}

export class ExpressionNode extends ASTNode {
  constructor(value, spans, params, label, aggregate) {
    super(EXPRESSION);
    this.value = value;
    this.spans = spans;
    this.params = params;
    this.label = label;
    this.aggregate = aggregate;
  }

  instantiate(ctx) {
    const { spans, params, label, aggregate } = this;
    const tag = ctx.api[aggregate ? AGG : SQL];
    const args = params.map(e => e.instantiate(ctx));
    return tag(spans, ...args).annotate({ label });
  }

  codegen(ctx) {
    const { spans, params, label, aggregate } = this;
    const method = aggregate ? AGG : SQL;

    // reconstitute expression string
    let str = '';
    const n = params.length;
    for (let i = 0; i < n; ++i) {
      str += spans[i] + '${' + params[i].codegen(ctx) + '}';
    }
    str += spans[n];

    return `${ctx.ns()}${method}\`${str}\``
      + (label ? `.annotate({ label: ${JSON.stringify(label)} })` : '');
  }

  toJSON() {
    const key = this.aggregate ? AGG : SQL;
    return { [key]: this.value };
  }
}
