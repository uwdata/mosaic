// `Transform` is defined recursively, so there is no possible order that avoids use before define
// oxlint-disable no-use-before-define
import type * as vg from '@uwdata/vgplot';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { TransformName } from '../config/transforms.js';
import { SQL, TRANSFORM } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { SQLExpression } from '../spec/Expression.js';
import type { IntervalTransform } from '../spec/Interval.js';
import type { Bin, Transform, TransformField } from '../spec/Transform.js';
import { isObject } from '../util.js';
import { ASTNode } from './ASTNode.js';
import type { ExpressionNode } from './ExpressionNode.js';
import { parseExpression } from './ExpressionNode.js';
import type { LiteralNode } from './LiteralNode.js';
import type { OptionsNode } from './OptionsNode.js';
import { parseOptions } from './OptionsNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { WindowFrameNode } from './WindowFrameNode.js';
import { parseWindowFrame } from './WindowFrameNode.js';

export type ParsedTransformNode = BinTransformNode | TransformNode;
// oxlint-disable-next-line typescript/no-explicit-any
type Arg = ExpressionNode | ParsedTransformNode | ParamRefNode | LiteralNode<any>;

type NotBin = Exclude<Transform, Bin>;
type NotBinName = Exclude<TransformName, 'bin'>;

type SQLFunction = InstantiateContext['api'][NotBinName];
type SQLExpr = ReturnType<SQLFunction>;

interface TransformOptions {
  distinct?: boolean;
  orderby: Arg[];
  partitionby: Arg[];
  frame: WindowFrameNode | null;
}

export function maybeTransform(
  value: SQLExpression | Transform | IntervalTransform,
  ctx: ParseContext,
): ExpressionNode | ParsedTransformNode | undefined {
  if (isObject(value)) {
    return SQL in value ? parseExpression(value, ctx) : parseTransform(value, ctx);
  }
}

function toArray(value: TransformField | [TransformField], ctx: ParseContext): Arg[] {
  // @ts-expect-error my brain is melting
  return [value ?? []].flat().map((v) => maybeTransform(v, ctx) ?? ctx.maybeParam(v));
}

function simplify<T>(array: T[]): T | T[] | '' {
  // oxlint-disable-next-line no-nested-ternary
  return array.length === 0 ? '' : array.length === 1 ? array[0] : array;
}

export function parseTransform(
  spec: Transform | IntervalTransform,
  ctx: ParseContext,
): BinTransformNode | TransformNode | undefined {
  // oxlint-disable-next-line no-undefined
  let name: TransformName | undefined = undefined;
  for (const key in spec) {
    if (ctx.transforms.has(key as TransformName)) {
      name = key as TransformName;
    }
  }

  if (!name) {
    return; // Return undefined to signal no transform!
  }

  if (name === 'bin') {
    if ('bin' in spec) {
      const { bin, ...options } = spec;
      const [arg] = toArray(bin, ctx);
      return new BinTransformNode(name, arg, parseOptions(options, ctx));
    }
    ctx.error('bin-possible', spec);
  } else {
    const args = name === 'count' && !spec[name] ? [] : toArray(spec[name], ctx);
    const options = {
      // @ts-expect-error bad narrowing
      distinct: spec.distinct,
      // @ts-expect-error bad narrowing
      orderby: toArray(spec.orderby, ctx),
      // @ts-expect-error bad narrowing
      partitionby: toArray(spec.partitionby, ctx),
      // @ts-expect-error bad narrowing
      frame: parseWindowFrame(spec, ctx),
    };
    return new TransformNode(name, args, options);
  }
}

export class TransformNode extends ASTNode<SQLExpr, NotBin> {
  constructor(
    readonly name: NotBinName,
    readonly args: Arg[],
    readonly options: TransformOptions,
  ) {
    super(TRANSFORM);
  }

  instantiate(ctx: InstantiateContext): SQLExpr {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;

    //@ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter.
    let expr = ctx.api[name](...args.map((a) => a.instantiate(ctx)));
    if (distinct) {
      // @ts-expect-error bad narrowing
      expr = expr.distinct();
    }
    if (orderby.length) {
      // @ts-expect-error bad narrowing
      expr = expr.orderby(orderby.map((v) => v.instantiate(ctx)));
    }
    if (partitionby.length) {
      // @ts-expect-error bad narrowing
      expr = expr.partitionby(partitionby.map((v) => v.instantiate(ctx)));
    }
    if (frame) {
      // @ts-expect-error bad narrowing
      expr = expr.frame(frame.instantiate(ctx));
    }
    return expr;
  }

  codegen(ctx: CodegenContext): string {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;

    let str = `${ctx.ns()}${name}(${args.map((v) => v.codegen(ctx)).join(', ')})`;

    if (distinct) {
      str += '.distinct()';
    }
    if (orderby.length) {
      const p = orderby.map((v) => v.codegen(ctx));
      str += `.orderby(${p.join(', ')})`;
    }
    if (partitionby.length) {
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

    //@ts-expect-error idek anymore
    const json: NotBin = { [name]: simplify(args.map((v) => v.toJSON())) };

    if (distinct) {
      //@ts-expect-error `distinct` only exists on `AggregateTransform`
      json.distinct = true;
    }
    if (orderby.length) {
      //@ts-expect-error `orderby` doesn't exist on `IntervalTransform`
      json.orderby = simplify(orderby.map((v) => v.toJSON()));
    }
    if (partitionby.length) {
      //@ts-expect-error `orderby` doesn't exist on `IntervalTransform`
      json.partitionby = simplify(partitionby.map((v) => v.toJSON()));
    }
    if (frame) {
      Object.assign(json, frame.toJSON());
    }

    return json;
  }
}

type VgBin = ReturnType<typeof vg.bin>;

export class BinTransformNode extends ASTNode<VgBin, Bin> {
  constructor(
    readonly name: 'bin',
    readonly arg: Arg,
    readonly options: OptionsNode,
  ) {
    super(TRANSFORM);
  }

  instantiate(ctx: InstantiateContext): VgBin {
    const { name, arg, options } = this;
    return ctx.api[name](arg.instantiate(ctx), options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const { name, arg, options } = this;
    const opt = options.codegen(ctx);
    return `${ctx.ns()}${name}(${arg.codegen(ctx)}${opt ? `, ${opt}` : ''})`;
  }

  toJSON(): Bin {
    const { name, arg, options } = this;
    return { [name]: arg.toJSON(), ...options.toJSON() };
  }
}
