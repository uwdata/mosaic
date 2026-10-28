// oxlint-disable no-use-before-define
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { TransformName } from '../config/transforms.js';
import { SQL, TRANSFORM } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { SQLExpression } from '../spec/Expression.js';
import type { Bin, Transform } from '../spec/Transform.js';
import { isObject } from '../util.js';
import type { JSONValue } from './ASTNode.js';
import { ASTNode } from './ASTNode.js';
import type { ExpressionNode } from './ExpressionNode.js';
import { parseExpression } from './ExpressionNode.js';
import type { LiteralNode } from './LiteralNode.js';
import type { OptionsNode } from './OptionsNode.js';
import { parseOptions } from './OptionsNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { WindowFrameNode } from './WindowFrameNode.js';
import { parseWindowFrame } from './WindowFrameNode.js';

export type ParsedTransform = BinTransformNode | TransformNode | undefined;
type Arg = ExpressionNode | ParsedTransform | ParamRefNode | LiteralNode<JSONValue> | null;

type NotBin = Exclude<Transform, Bin>;
type NotBinName = Exclude<TransformName, 'bin'>;

type SQLFunction = InstantiateContext['api'][NotBinName];
type SQLExpr = ReturnType<SQLFunction>;
type SQLBin = ReturnType<InstantiateContext['api']['bin']>;

interface TransformOptions {
  distinct?: unknown;
  orderby: Arg[];
  partitionby: Arg[];
  frame: WindowFrameNode | null;
}

function toArray(value: unknown, ctx: ParseContext): Arg[] {
  // oxlint-disable-next-line no-eq-null unicorn/no-null
  return value == null
    ? []
    : [value].flat().map((v) => maybeTransform(v, ctx) || ctx.maybeParam(v));
}

function isSQLExpression(value: object): value is SQLExpression {
  return SQL in value;
}

export function maybeTransform(
  value: unknown,
  ctx: ParseContext,
): ExpressionNode | ParsedTransform {
  if (isObject(value)) {
    return isSQLExpression(value) ? parseExpression(value, ctx) : parseTransform(value, ctx);
  }
}

export function parseTransform(spec: Record<string, unknown>, ctx: ParseContext): ParsedTransform {
  // oxlint-disable-next-line init-declarations
  let name: TransformName;
  for (const key in spec) {
    if (ctx.transforms.has(key as TransformName)) {
      name = key as TransformName;
    }
  }
  //@ts-expect-error `name` used before defined
  if (!name) {
    return; // Return undefined to signal no transform!
  }

  if (name === 'bin') {
    const { bin, ...options } = spec;
    const [arg] = toArray(bin, ctx);
    return new BinTransformNode(name, arg, parseOptions(options, ctx));
  } else {
    const args = name === 'count' && !spec[name] ? [] : toArray(spec[name], ctx);
    return new TransformNode(name, args, {
      distinct: spec.distinct,
      orderby: toArray(spec.orderby, ctx),
      partitionby: toArray(spec.partitionby, ctx),
      frame: parseWindowFrame(spec, ctx),
    });
  }
}

export class TransformNode extends ASTNode<SQLExpr, string, NotBin> {
  readonly name: NotBinName;
  readonly args: Arg[];
  readonly options: TransformOptions;
  constructor(name: NotBinName, args: Arg[], options: TransformOptions) {
    super(TRANSFORM);
    this.name = name;
    this.args = args;
    this.options = options;
  }

  instantiate(ctx: InstantiateContext): SQLExpr {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;
    const sql_fn: SQLFunction = ctx.api[name];

    //@ts-expect-error `a` is possibly `null | undefined`
    let expr: SQLExpr = sql_fn(...args.map((a) => a.instantiate(ctx)));
    if (distinct && 'distinct' in expr) {
      expr = expr.distinct();
    }
    if (orderby.length && 'orderby' in expr) {
      //@ts-expect-error `v` is possibly `null | undefined`
      expr = expr.orderby(orderby.map((v) => v.instantiate(ctx)));
    }
    if (partitionby.length && 'partitionby' in expr) {
      //@ts-expect-error `v` is possibly `null | undefined`
      expr = expr.partitionby(partitionby.map((v) => v.instantiate(ctx)));
    }
    if (frame && 'frame' in expr) {
      expr = expr.frame(frame.instantiate(ctx));
    }
    return expr;
  }

  codegen(ctx: CodegenContext): string {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;
    //@ts-expect-error `v` is possibly `null | undefined`
    let str = `${ctx.ns()}${name}(${args.map((v) => v.codegen(ctx)).join(', ')})`;

    if (distinct) {
      str += '.distinct()';
    }
    if (orderby.length) {
      //@ts-expect-error `v` is possibly `null | undefined`
      const p = orderby.map((v) => v.codegen(ctx));
      str += `.orderby(${p.join(', ')})`;
    }
    if (partitionby.length) {
      //@ts-expect-error `v` is possibly `null | undefined`
      const p = partitionby.map((v) => v.codegen(ctx));
      str += `.partitionby(${p.join(', ')})`;
    }
    if (frame) {
      str += `.frame(${frame.codegen(ctx)})`;
    }

    return str;
  }

  toJSON(): NotBin {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;
    //@ts-expect-error `v` is possibly `null | undefined`
    const json: NotBin = { [name]: simplify(args.map((v) => v.toJSON())) };

    if (distinct) {
      //@ts-expect-error `distinct` only exists on `AggregateTransform`
      json.distinct = true;
    }
    if (orderby.length) {
      //@ts-expect-error `v` is possibly `null | undefined`
      json.orderby = simplify(orderby.map((v) => v.toJSON()));
    }
    if (partitionby.length) {
      //@ts-expect-error `v` is possibly `null | undefined`
      json.partitionby = simplify(partitionby.map((v) => v.toJSON()));
    }
    if (frame) {
      Object.assign(json, frame.toJSON());
    }

    return json;
  }
}

export class BinTransformNode extends ASTNode<SQLBin, string, Bin> {
  readonly name: 'bin';
  readonly arg: Arg;
  readonly options: OptionsNode;
  constructor(name: 'bin', arg: Arg, options: OptionsNode) {
    super(TRANSFORM);
    this.name = name;
    this.arg = arg;
    this.options = options;
  }

  instantiate(ctx: InstantiateContext): SQLBin {
    const { name, arg, options } = this;
    //@ts-expect-error `arg` is possibly `null | undefined`
    return ctx.api[name](arg.instantiate(ctx), options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const { name, arg, options } = this;
    const opt = options.codegen(ctx);
    //@ts-expect-error `arg` is possibly `null | undefined`
    return `${ctx.ns()}${name}(${arg.codegen(ctx)}${opt ? `, ${opt}` : ''})`;
  }

  toJSON(): Bin {
    const { name, arg, options } = this;
    //@ts-expect-error `arg` is possibly `null | undefined`
    return { [name]: arg.toJSON(), ...options.toJSON() };
  }
}

function simplify<T>(array: T[]): T | T[] | '' {
  switch (array.length) {
    case 0: {
      return '';
    }
    case 1: {
      return array[0];
    }
    default: {
      return array;
    }
  }
}
