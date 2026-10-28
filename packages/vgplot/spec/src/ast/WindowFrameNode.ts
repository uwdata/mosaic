import type { FrameType } from '@uwdata/mosaic-sql';
import { WindowFrameNode as WindowFrame } from '@uwdata/mosaic-sql';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { WINDOW_FRAME } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { FrameExclude, WindowOptions } from '../spec/Transform.js';
import { isArray, isObject, paramRef } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { ParsedTransform } from './TransformNode.js';
import { parseTransform } from './TransformNode.js';

type Extent = ParamRefNode | (ParsedTransform | LiteralNode<number | null>)[] | null;

export function parseWindowFrame(spec: WindowOptions, ctx: ParseContext): WindowFrameNode | null {
  // oxlint-disable-next-line no-nested-ternary unicorn/no-null
  const type = spec.rows ? 'ROWS' : spec.range ? 'RANGE' : spec.groups ? 'GROUPS' : null;

  if (!type) {
    // oxlint-disable-next-line unicorn/no-null
    return null;
  }
  const lower = type.toLowerCase() as Lowercase<typeof type>;
  // oxlint-disable-next-line typescript/no-non-null-assertion (`type` guarantees one of the `extent` values are present)
  const value = spec[lower]!;

  const extent = isArray(value)
    ? // @ts-expect-error `IntervalTransform` is not assignable to `Record<string, unknown>`?
      value.map((v) => (isObject(v) ? parseTransform(v, ctx) : new LiteralNode(v)))
    : ctx.paramRef(paramRef(value));

  // oxlint-disable-next-line no-use-before-define
  return new WindowFrameNode(type, extent, spec.exclude);
}

export class WindowFrameNode extends ASTNode {
  readonly type: FrameType;
  readonly extent: Extent;
  readonly exclude: FrameExclude | undefined;
  constructor(type: FrameType, extent: Extent, exclude: WindowOptions['exclude']) {
    super(WINDOW_FRAME);
    this.type = type;
    this.extent = extent;
    this.exclude = exclude?.toUpperCase() as FrameExclude;
  }

  instantiate(ctx: InstantiateContext): WindowFrame {
    const { type, extent, exclude } = this;

    const ex = Array.isArray(extent)
      ? //@ts-expect-error `v` possibly null
        extent.map((v) => v.instantiate(ctx))
      : //@ts-expect-error `extent` possibly null
        extent.instantiate(ctx);
    //@ts-expect-error `ex` possibly `undefined`
    return new WindowFrame(type, ex, exclude?.toUpperCase() as FrameExclude);
  }

  codegen(ctx: CodegenContext): string {
    const { type, extent, exclude } = this;
    const fn = `frame${type[0].toUpperCase()}${type.slice(1).toLowerCase()}`;
    const ex = Array.isArray(extent)
      ? //@ts-expect-error `v` possibly undefined
        `[${extent.map((v) => v.codegen(ctx)).join(', ')}]`
      : //@ts-expect-error `extent` possibly null
        extent.codegen(ctx);
    const cl = exclude ? `, '${exclude.toUpperCase()}'` : '';
    return `${ctx.ns()}${fn}(${ex}${cl})`;
  }

  toJSON(): Omit<WindowOptions, 'orderby' | 'partitionby'> {
    const { type, extent, exclude } = this;
    const key = type.toLowerCase() as Lowercase<FrameType>;
    //@ts-expect-error `v` and `extent` are possibly null
    const ex = Array.isArray(extent) ? extent.map((v) => v.toJSON()) : extent.toJSON();
    return { [key]: ex, exclude };
  }
}
