// oxlint-disable unicorn/no-null
import * as sql from '@uwdata/mosaic-sql';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { WINDOW_FRAME } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { WindowOptions } from '../spec/Transform.js';
import { isArray, isObject, mapTuple } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { ParsedTransformNode } from './TransformNode.js';
import { parseTransform } from './TransformNode.js';

type FrameValue = ParsedTransformNode | LiteralNode<number | null>;
type FrameExtent = ParamRefNode | [FrameValue, FrameValue];
type FrameExclude = WindowOptions['exclude'];

export class WindowFrameNode extends ASTNode<
  sql.WindowFrameNode,
  Omit<WindowOptions, 'orderby' | 'partitionby'>
> {
  constructor(
    readonly type: sql.FrameType,
    readonly extent: FrameExtent,
    readonly exclude?: FrameExclude,
  ) {
    super(WINDOW_FRAME);
  }

  instantiate(ctx: InstantiateContext): sql.WindowFrameNode {
    const { type, extent, exclude } = this;
    return new sql.WindowFrameNode(
      type,
      //@ts-expect-error Type '{ (mark: any, channel: any): { [x: string]: BinTransformNode; }; [Transform]: boolean; }' is not assignable to type 'FrameValue'
      isArray(extent) ? mapTuple(extent, (v) => v.instantiate(ctx)) : extent.instantiate(ctx),
      exclude?.toUpperCase() as sql.FrameExclude,
    );
  }

  codegen(ctx: CodegenContext): string {
    const { type, extent, exclude } = this;
    const fn = `frame${type[0].toUpperCase()}${type.slice(1).toLowerCase()}`;
    const ex = isArray(extent)
      ? `[${extent.map((v) => v.codegen(ctx)).join(', ')}]`
      : extent.codegen(ctx);
    const cl = exclude ? `, '${exclude.toUpperCase()}'` : '';
    return `${ctx.ns()}${fn}(${ex}${cl})`;
  }

  toJSON(): Omit<WindowOptions, 'orderby' | 'partitionby'> {
    const { type, extent, exclude } = this;
    const key = type.toLowerCase();
    const ex = isArray(extent) ? extent.map((v) => v.toJSON()) : extent.toJSON();
    return { [key]: ex, exclude };
  }
}

export function parseWindowFrame(spec: WindowOptions, ctx: ParseContext): WindowFrameNode | null {
  // oxlint-disable-next-line no-nested-ternary
  const type = spec.rows ? 'ROWS' : spec.range ? 'RANGE' : spec.groups ? 'GROUPS' : null;
  if (!type) {
    return null;
  }

  // Need to force lowercase for the next lookup to be inferred
  // (`type` guarantees one of the `extent` values are present)
  // oxlint-disable-next-line typescript/no-non-null-assertion
  const value = spec[type.toLowerCase() as Lowercase<typeof type>]!;
  if (typeof value === 'string') {
    const name = value[0] === '$' ? value.slice(1) : ctx.error(`Invalid ParamRef ${value}`, spec);
    return new WindowFrameNode(type, ctx.paramRef(name), spec.exclude);
  }

  const extent = mapTuple(value, (v) =>
    isObject(v) ? (parseTransform(v, ctx) ?? LiteralNode.null()) : new LiteralNode(v),
  );
  return new WindowFrameNode(type, extent, spec.exclude);
}
