import { LiteralNode, WindowFrameNode as WindowFrame } from '@uwdata/mosaic-sql';
import { WINDOW_FRAME } from '../constants.js';
import { isObject, paramRef } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { parseTransform } from './TransformNode.js';

export function parseWindowFrame(spec, ctx) {
  const type = spec.rows ? 'ROWS'
    : spec.range ? 'RANGE'
    : spec.groups ? 'GROUPS'
    : null;

  if (!type) return null;

  const value = spec[type.toLowerCase()];
  const name = paramRef(value);
  const extent = name
    ? ctx.paramRef(name)
    : value.map(v => isObject(v)
        ? parseTransform(v, ctx)
        : new LiteralNode(v)
      );

  return new WindowFrameNode(type, extent, spec.exclude);
}

export class WindowFrameNode extends ASTNode {
  constructor(type, extent, exclude) {
    super(WINDOW_FRAME);
    this.type = type;
    this.extent = extent;
    this.exclude = exclude?.toUpperCase();
  }

  instantiate(ctx) {
    const { type, extent, exclude } = this;
    const ex = Array.isArray(extent)
      ? extent.map(v => v.instantiate(ctx))
      : extent.instantiate(ctx);
    return new WindowFrame(type, ex, exclude?.toUpperCase());
  }

  codegen(ctx) {
    const { type, extent, exclude } = this;
    const fn = `frame${type[0].toUpperCase()}${type.slice(1).toLowerCase()}`;
    const ex = Array.isArray(extent)
      ? `[${extent.map(v => v.codegen(ctx)).join(', ')}]`
      : extent.codegen(ctx);
    const cl = exclude ? `, '${exclude.toUpperCase()}'` : '';
    return `${ctx.ns()}${fn}(${ex}${cl})`;
  }

  toJSON() {
    const { type, extent, exclude } = this;
    const key = type.toLowerCase();
    const ex = Array.isArray(extent)
      ? extent.map(v => v.toJSON())
      : extent.toJSON();
    return { [key]: ex, exclude };
  }
}
