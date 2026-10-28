// oxlint-disable no-magic-numbers, no-plusplus
import type { FragmentNode } from '@uwdata/mosaic-sql';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { EXPRESSION, SQL } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { SQLExpression } from '../spec/Expression.js';
import { ASTNode } from './ASTNode.js';
import { ColumnParamRefNode } from './ColumnParamRefNode.js';
import type { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';

type Params = (ColumnParamRefNode | ParamRefNode | LiteralNode | null)[];

// oxlint-disable-next-line prefer-named-capture-group
const tokenRegExp = /(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\${1,2}\w+)/g;

export function parseExpression(spec: SQLExpression, ctx: ParseContext): ExpressionNode {
  const expr = spec[SQL];
  const tokens = expr.split(tokenRegExp);
  const spans: string[] = [''];
  const params: Params = [];

  for (let i = 0, k = 0; i < tokens.length; ++i) {
    const tok = tokens[i];
    if (tok.startsWith('$')) {
      params[k] = tok.startsWith('$$')
        ? // @ts-expect-error  `ParamRefNode | null`
          new ColumnParamRefNode(ctx.paramRef(tok.slice(2)))
        : ctx.maybeParam(tok);
      spans[++k] = '';
    } else {
      spans[k] += tok;
    }
  }

  // oxlint-disable-next-line no-use-before-define
  return new ExpressionNode(expr, spans, params);
}

export class ExpressionNode extends ASTNode<FragmentNode, string, SQLExpression> {
  readonly value: string;
  readonly spans: string[];
  readonly params: Params;
  constructor(value: string, spans: string[], params: Params) {
    super(EXPRESSION);
    this.value = value;
    this.spans = spans;
    this.params = params;
  }

  instantiate(ctx: InstantiateContext): FragmentNode {
    const { spans, params } = this;
    const tag = ctx.api[SQL];
    //@ts-expect-error `e` is possibly null
    const args = params.map((e) => e.instantiate(ctx));
    //@ts-expect-error  'string[]' is not assignable to 'TemplateStringsArray'. (missing `raw`)
    return tag(spans, ...args);
  }

  codegen(ctx: CodegenContext): string {
    const { spans, params } = this;

    // Reconstitute expression string
    let str = '';
    const n = params.length;
    for (let i = 0; i < n; ++i) {
      //@ts-expect-error `params[i]` is possibly null
      str += `${spans[i]}\${${params[i].codegen(ctx)}}`;
    }
    str += spans[n];

    return `${ctx.ns()}${SQL}\`${str}\``;
  }

  toJSON(): SQLExpression {
    return { [SQL]: this.value };
  }
}
