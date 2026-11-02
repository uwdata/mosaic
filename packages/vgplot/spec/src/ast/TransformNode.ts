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
import type {
  AggregateTransform,
  Bin,
  Transform,
  TransformField,
  WindowTransform,
} from '../spec/Transform.js';
import { isObject, makeIsIn } from '../util.js';
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
type TransformAny = Transform | IntervalTransform;

type SQLFunction = InstantiateContext['api'][NotBinName];
type SQLExpr = ReturnType<SQLFunction>;

interface TransformOptions {
  distinct?: boolean;
  orderby: Arg[];
  partitionby: Arg[];
  frame: WindowFrameNode | null;
}

/**
 * Return true if an object's keys intersect with {@link AggregateTransform} or
 * {@link WindowTransform} options.
 */
const hasWindowOptions = (() => {
  const predicate = makeIsIn(
    new Set(['distinct', 'orderby', 'partitionby', 'rows', 'range', 'groups'] as const),
  );
  return (spec: object): spec is AggregateTransform | WindowTransform =>
    typeof Object.keys(spec).find(predicate) !== 'undefined';
})();

export function maybeTransform(
  value: SQLExpression | TransformAny,
  ctx: ParseContext,
): ExpressionNode | ParsedTransformNode | undefined {
  if (isObject(value)) {
    return SQL in value ? parseExpression(value, ctx) : parseTransform(value, ctx);
  }
}

function parseArgs(value: TransformField | TransformField[], ctx: ParseContext): Arg[] {
  return [value ?? []].flat().map((v) => {
    if (typeof v === 'string') {
      return ctx.maybeParam(v);
    }
    if (isObject(v)) {
      return SQL in v
        ? parseExpression(v, ctx)
        : (parseTransform(v, ctx) ?? ctx.error(`Invalid transform argument ${v}`, value));
    }
    return ctx.maybeParam(v);
  });
}

function simplify<T>(array: T[]): T | T[] | '' {
  // oxlint-disable-next-line no-nested-ternary
  return array.length === 0 ? '' : array.length === 1 ? array[0] : array;
}

// oxlint-disable no-undefined unicorn/no-null
export function parseTransform(
  spec: TransformAny,
  ctx: ParseContext,
  allowBin: false,
): TransformNode | undefined;
export function parseTransform(
  spec: TransformAny,
  ctx: ParseContext,
): BinTransformNode | TransformNode | undefined;
export function parseTransform(
  spec: TransformAny,
  ctx: ParseContext,
  allowBin: boolean = true,
): BinTransformNode | TransformNode | undefined {
  const name = Object.keys(spec).find(makeIsIn(ctx.transforms as Set<TransformName>));
  if (!name) {
    return; // Return undefined to signal no transform!
  }
  if (name === 'bin') {
    if (!allowBin) {
      ctx.error('bin transforms are not valid in this context', spec);
    }
    if ('bin' in spec) {
      const { bin, ...options } = spec;
      const [arg] = parseArgs(bin, ctx);
      return new BinTransformNode(name, arg, parseOptions(options, ctx));
    }
    ctx.error('bin-possible', spec);
  }
  const args = name === 'count' && !spec[name] ? [] : parseArgs(spec[name], ctx);
  return new TransformNode(name, args, parseWindowOptions(spec, ctx));
}

function parseWindowOptions(spec: TransformAny, ctx: ParseContext): TransformOptions {
  const options: TransformOptions = {
    distinct: undefined,
    orderby: [],
    partitionby: [],
    frame: null,
  };
  if (!hasWindowOptions(spec)) {
    return options;
  }
  if ('distinct' in spec) {
    options.distinct = spec.distinct;
  }
  const { orderby, partitionby } = spec;
  if (orderby) {
    options.orderby = parseArgs(orderby, ctx);
  }
  if (partitionby) {
    options.partitionby = parseArgs(partitionby, ctx);
  }
  options.frame = parseWindowFrame(spec, ctx);
  return options;
}

// oxlint-enable no-undefined unicorn/no-null

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
    if (distinct && 'distinct' in expr) {
      expr = expr.distinct();
    }
    if (orderby.length && 'orderby' in expr) {
      expr = expr.orderby(orderby.map((v) => v.instantiate(ctx)));
    }
    if (partitionby.length && 'partitionby' in expr) {
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

    const json = { [name]: simplify(args.map((v) => v.toJSON())) } as NotBin;

    // Fixing the errors below requires splitting `TransformNode` into multiple classes
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
