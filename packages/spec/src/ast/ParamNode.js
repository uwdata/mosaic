import { parse as isoparse } from 'isoformat';
import { isArray, isObject } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { CROSSFILTER, INTERSECT, PARAM, SINGLE, UNION, VALUE } from '../constants.js';
import { SelectionNode } from './SelectionNode.js';

const paramTypes = new Set([VALUE, SINGLE, CROSSFILTER, INTERSECT, UNION]);

export function parseParam(spec, ctx) {
  const param = isObject(spec) ? spec : { value: spec };
  const { select = VALUE, cross, date, value } = param;
  if (!paramTypes.has(select)) {
    ctx.error(`Unrecognized param type: ${select}`, param);
  }

  if (select !== VALUE) {
    return new SelectionNode(select, cross);
  } else if (isArray(value)) {
    return new ParamNode(value.map(v => ctx.maybeParam(v)));
  } else {
    return new ParamNode(value, date);
  }
}

export class ParamNode extends ASTNode {
  constructor(value, date) {
    super(PARAM);
    this.value = value;
    this.date = date;
  }

  instantiate(ctx) {
    const { date, value } = this;
    const { Param } = ctx.api;
    return isArray(value)
      ? Param.array(value.map(v => v.instantiate(ctx)))
      : Param.value(isoparse(date, value));
  }

  codegen(ctx) {
    const { value, date } = this;
    const prefix = `${ctx.ns()}Param.`;
    return isArray(value)
      ? `${prefix}array([${value.map(v => v.codegen(ctx)).join(', ')}])`
      : date ? `${prefix}value(new Date(${JSON.stringify(date)}))`
      : `${prefix}value(${JSON.stringify(value)})`;
  }

  toJSON() {
    const { date, value } = this;
    return isArray(value) ? value.map(v => v.toJSON())
      : date ? { date }
      : value;
  }
}
