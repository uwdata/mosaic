// oxlint-disable no-use-before-define
import type * as mc from '@uwdata/mosaic-core';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { CROSSFILTER, INTERSECT, PARAM, SINGLE, UNION, VALUE } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { Param, ParamDate, ParamDefinition, ParamLiteral, Selection } from '../spec/Param.js';
import { isArray, isObject, isoparse } from '../util.js';
import { ASTNode } from './ASTNode.js';
import type { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { SelectionNode } from './SelectionNode.js';
import { parseSelection } from './SelectionNode.js';

const paramTypes = new Set([VALUE, SINGLE, CROSSFILTER, INTERSECT, UNION] as const);

type Value = string | number | boolean | null | (ParamRefNode | LiteralNode<ParamLiteral> | null)[];

function isSelection(value: Param | ParamDate | Selection): value is Selection {
  return typeof value.select !== 'undefined' && value.select !== VALUE;
}

export function parseParam(spec: ParamDefinition, ctx: ParseContext): ParamNode | SelectionNode {
  if (isArray(spec)) {
    return new ParamNode(spec.map((v) => ctx.maybeParam(v)));
  }
  if (!isObject(spec)) {
    return new ParamNode(spec);
  }
  if (isSelection(spec)) {
    return parseSelection(spec, ctx);
  }
  if (!paramTypes.has(spec.select ?? 'value')) {
    ctx.error(`Unrecognized param type: ${spec.select}`, spec);
  }
  return new ParamNode(spec['value'], spec['date']);
}

export class ParamNode extends ASTNode<mc.Param<unknown>, string, unknown> {
  readonly value: Value | undefined;
  readonly date: string | undefined;
  constructor(value?: Value, date?: string) {
    super(PARAM);
    this.value = value;
    this.date = date;
  }

  instantiate(ctx: InstantiateContext): mc.Param<unknown> {
    const { date, value } = this;
    const { Param } = ctx.api;
    return isArray(value)
      ? // @ts-expect-error `v` is possibly null
        Param.array(value.map((v) => v.instantiate(ctx)))
      : Param.value<unknown>(isoparse(date, value));
  }

  codegen(ctx: CodegenContext): string {
    const { value, date } = this;
    const prefix = `${ctx.ns()}Param.`;
    // oxlint-disable-next-line no-nested-ternary
    return isArray(value)
      ? // @ts-expect-error `v` is possibly null
        `${prefix}array([${value.map((v) => v.codegen(ctx)).join(', ')}])`
      : // oxlint-disable-next-line unicorn/no-nested-ternary
        date
        ? `${prefix}value(new Date(${JSON.stringify(date)}))`
        : `${prefix}value(${JSON.stringify(value)})`;
  }

  // oxlint-disable-next-line typescript/explicit-module-boundary-types typescript/explicit-function-return-type
  toJSON(): unknown {
    const { date, value } = this;
    // @ts-expect-error `v` is possibly null
    // oxlint-disable-next-line no-nested-ternary
    return isArray(value) ? value.map((v) => v.toJSON()) : date ? { date } : value;
  }
}
