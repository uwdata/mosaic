import {
  avg, count, max, median, min, mode, quantile, sum,
  row_number, rank, dense_rank, percent_rank, cume_dist, ntile,
  lag, lead, first_value, last_value, nth_value,
  dateMonth, dateMonthDay, dateDay
} from '@uwdata/mosaic-sql';
import { bin } from '@uwdata/vgplot';
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

  const args = name === 'count' || name == null ? [] : toArray(spec[name]);
  const options = {
    distinct: spec.distinct,
    orderby: toArray(spec.orderby).map(v => ctx.maybeParam(v)),
    partitionby: toArray(spec.partitionby).map(v => ctx.maybeParam(v)),
    rows: spec.rows ? ctx.maybeParam(spec.rows) : null,
    range: spec.range ? ctx.maybeParam(spec.range) : null
  };

  return new TransformNode(name, args, options);
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

    const fn = ctx.transforms.get(name);
    let expr = fn(...args);
    if (distinct) {
      expr = expr.distinct();
    }
    if (orderby.length) {
      expr = expr.orderby(orderby.map(v => ctx.instantiateParam(v)));
    }
    if (partitionby.length) {
      expr = expr.partitionby(partitionby.map(v => ctx.instantiateParam(v)));
    }
    if (rows != null) {
      expr = expr.rows(ctx.instantiateParam(rows));
    } else if (range != null) {
      expr = expr.range(ctx.instantiateParam(range));
    }
    return expr;
  }

  codegen(ctx) {
    const { name, args, options } = this;
    const { distinct, orderby, partitionby, rows, range } = options;

    let str = `${ctx.ns()}${name}(`
      + args.map(v => ctx.codegenParam(v)).join(', ')
      + ')';

    if (distinct) {
      str += '.distinct()'
    }
    if (orderby.length) {
      const p = orderby.map(v => ctx.codegenParam(v));
      str += `.orderby(${p.join(', ')})`;
    }
    if (partitionby.length) {
      const p = partitionby.map(v => ctx.codegenParam(v));
      str += `.partitionby(${p.join(', ')})`;
    }
    if (rows) {
      str += `.rows(${ctx.codegenParam(rows)})`;
    } else if (range) {
      str += `.range(${ctx.codegenParam(range)})`;
    }

    return str;
  }
}
