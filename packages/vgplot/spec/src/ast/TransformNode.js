import { ASTNode } from './ASTNode.js';
import { TRANSFORM } from '../constants.js';
import { parseOptions } from './OptionsNode.js';
import { parseWindowFrame } from './WindowFrameNode.js';

function toArray(value, ctx) {
  return value == null
    ? []
    : [value].flat().map(v => ctx.maybeParam(v));
}

export function parseTransform(spec, ctx) {
  let name;
  for (const key in spec) {
    if (ctx.transforms.has(key)) {
      name = key;
    }
  }

  if (!name) {
    return; // return undefined to signal no transform!
  }

  if (name === 'bin') {
    const { bin, ...options } = spec;
    const [arg] = toArray(bin, ctx);
    return new BinTransformNode(name, arg, parseOptions(options, ctx));
  } else {
    const args = name === 'count' && !spec[name] ? [] : toArray(spec[name], ctx);
    const options = {
      distinct: spec.distinct,
      orderby: toArray(spec.orderby, ctx),
      partitionby: toArray(spec.partitionby, ctx),
      frame: parseWindowFrame(spec, ctx)
    };
    return new TransformNode(name, args, options);
  }
}

export class TransformNode extends ASTNode {
  constructor(name, args, options) {
    super(TRANSFORM);
    this.name = name;
    this.args = args;
    this.options = options;
  }

  instantiate(ctx) {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;

    let expr = ctx.api[name](...args.map(a => a.instantiate(ctx)));
    if (distinct) {
      expr = expr.distinct();
    }
    if (orderby.length) {
      expr = expr.orderby(orderby.map(v => v.instantiate(ctx)));
    }
    if (partitionby.length) {
      expr = expr.partitionby(partitionby.map(v => v.instantiate(ctx)));
    }
    if (frame) {
      expr = expr.frame(frame.instantiate(ctx));
    }
    return expr;
  }

  codegen(ctx) {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;

    let str = `${ctx.ns()}${name}(`
      + args.map(v => v.codegen(ctx)).join(', ')
      + ')';

    if (distinct) {
      str += '.distinct()'
    }
    if (orderby.length) {
      const p = orderby.map(v => v.codegen(ctx));
      str += `.orderby(${p.join(', ')})`;
    }
    if (partitionby.length) {
      const p = partitionby.map(v => v.codegen(ctx));
      str += `.partitionby(${p.join(', ')})`;
    }
    if (frame) {
      str += `.frame(${frame.codegen(ctx)})`;
    }

    return str;
  }

  toJSON() {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, frame } = options;

    const json = { [name]: simplify(args.map(v => v.toJSON())) };

    if (distinct) {
      json.distinct = true;
    }
    if (orderby.length) {
      json.orderby = simplify(orderby.map(v => v.toJSON()));
    }
    if (partitionby.length) {
      json.partitionby = simplify(partitionby.map(v => v.toJSON()));
    }
    if (frame) {
      Object.assign(json, frame.toJSON());
    }

    return json;
  }
}

export class BinTransformNode extends ASTNode {
  constructor(name, arg, options) {
    super(TRANSFORM);
    this.name = name;
    this.arg = arg;
    this.options = options;
  }

  instantiate(ctx) {
    const { name, arg, options } = this;
    return ctx.api[name](arg.instantiate(ctx), options.instantiate(ctx));
  }

  codegen(ctx) {
    const { name, arg, options } = this;
    const opt = options.codegen(ctx);
    return `${ctx.ns()}${name}(`
        + arg.codegen(ctx)
        + (opt ? `, ${opt}` : '')
        + ')';
  }

  toJSON() {
    const { name, arg, options } = this;
    return { [name]: arg.toJSON(), ...options.toJSON() };
  }
}

function simplify(array) {
  return array.length === 0 ? '' : array.length === 1 ? array[0] : array;
}
