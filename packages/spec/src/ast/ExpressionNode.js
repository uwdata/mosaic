import { EXPRESSION, SQL } from '../constants.js';
import { ASTNode } from './ASTNode.js';

const tokenRegExp = /(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$\w+)/g;

export function parseExpression(spec, ctx) {
  const expr = spec[SQL];
  const tokens = expr.split(tokenRegExp);
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

  return new ExpressionNode(expr, spans, params);
}

export class ExpressionNode extends ASTNode {
  constructor(value, spans, params) {
    super(EXPRESSION);
    this.value = value;
    this.spans = spans;
    this.params = params;
  }

  instantiate(ctx) {
    const { spans, params } = this;
    const tag = ctx.api[SQL];
    const args = params.map(e => e.instantiate(ctx));
    return tag(spans, ...args);
  }

  codegen(ctx) {
    const { spans, params } = this;

    // reconstitute expression string
    let str = '';
    const n = params.length;
    for (let i = 0; i < n; ++i) {
      str += spans[i] + '${' + params[i].codegen(ctx) + '}';
    }
    str += spans[n];

    return `${ctx.ns()}${SQL}\`${str}\``;
  }

  toJSON() {
    return { [SQL]: this.value };
  }
}
