import { ASTNode } from './ASTNode.js';
import { TRANSFORM } from '../constants.js';

function toArray(value) {
  return value == null ? [] : [value].flat();
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
    return new TransformNode(name, [toArray(bin)[0], options], {});
  } else {
    const args = name === 'count' && !spec[name] ? [] : toArray(spec[name]);
    const options = {
      distinct: spec.distinct,
      orderby: toArray(spec.orderby).map(v => ctx.maybeParam(v)),
      partitionby: toArray(spec.partitionby).map(v => ctx.maybeParam(v)),
      rows: spec.rows ? ctx.maybeParam(spec.rows) : null,
      range: spec.range ? ctx.maybeParam(spec.range) : null
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
    const { distinct, orderby, partitionby, rows, range } = options;

    let expr = ctx.api[name](...args);
    if (distinct) {
      expr = expr.distinct();
    }
    if (orderby?.length) {
      expr = expr.orderby(orderby.map(v => v.instantiate(ctx)));
    }
    if (partitionby?.length) {
      expr = expr.partitionby(partitionby.map(v => v.instantiate(ctx)));
    }
    if (rows != null) {
      expr = expr.rows(rows.instantiate(ctx));
    } else if (range != null) {
      expr = expr.range(range.instantiate(ctx));
    }
    return expr;
  }

  codegen(ctx) {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, rows, range } = options;

    let str = `${ctx.ns()}${name}(`
      + args.map(v => JSON.stringify(v)).join(', ')
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
    if (rows) {
      str += `.rows(${rows.codegen(ctx)})`;
    } else if (range) {
      str += `.range(${range.codegen(ctx)})`;
    }

    return str;
  }

  toJSON() {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, rows, range } = options;

    const json = { [name]: simplify(args) };

    if (distinct) {
      json.distinct = true;
    }
    if (orderby.length) {
      json.orderby = simplify(orderby.map(v => v.toJSON()));
    }
    if (partitionby.length) {
      json.partitionby = simplify(partitionby.map(v => v.toJSON()));
    }
    if (rows) {
      json.rows = rows.toJSON();
    } else if (range) {
      json.range = range.toJSON();
    }

    return json;
  }
}

function simplify(array) {
  return array.length === 0 ? '' : array.length === 1 ? array[0] : array;
}
