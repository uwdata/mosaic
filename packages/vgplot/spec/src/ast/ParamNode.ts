import type * as mc from '@uwdata/mosaic-core';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { PARAM, VALUE, SELECT } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { ParamDate, ParamDefinition, ParamLiteral } from '../spec/Param.js';
import { isArray, isISO8601, isObject } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { SelectionNode } from './SelectionNode.js';
import { parseSelection } from './SelectionNode.js';

/* NOTE: Backwards-compat shim to keep `new ParamNode()` working.
 * Would prefer this to be an abstract class, but it is exposed at the top-level.*/
export class ParamNode<
  // oxlint-disable-next-line typescript/no-explicit-any
  V = any,
  J extends ParamDefinition = ParamDefinition,
> extends ASTNode<mc.Param<V>, J> {
  constructor() {
    super(PARAM);
  }
  // oxlint-disable-next-line class-methods-use-this
  protected prefix(ctx: CodegenContext): string {
    return `${ctx.ns()}Param`;
  }

  // oxlint-disable-next-line class-methods-use-this
  instantiate(ctx: InstantiateContext): mc.Param<V> {
    return new ctx.api.Param();
  }
  codegen(ctx: CodegenContext): string {
    return `new ${this.prefix(ctx)}()`;
  }
  // oxlint-disable-next-line class-methods-use-this
  toJSON(): J {
    // @ts-expect-error undefined is not assignable to `ParamDefinition`
    return;
  }
}

class ParamValueNode<T extends ParamLiteral = ParamLiteral> extends ParamNode<T, T> {
  constructor(readonly value: LiteralNode<T>) {
    super();
  }

  instantiate(ctx: InstantiateContext): mc.Param<T> {
    return ctx.api.Param.value(this.value.instantiate());
  }
  codegen(ctx: CodegenContext): string {
    return `${this.prefix(ctx)}.value(${this.value.codegen(ctx)})`;
  }
  toJSON(): T {
    return this.value.toJSON();
  }
}

type Value = LiteralNode<ParamLiteral> | ParamRefNode;

class ParamArrayNode<T extends Value = Value> extends ParamNode<unknown[], ParamLiteral[]> {
  constructor(readonly value: T[]) {
    super();
  }

  instantiate(ctx: InstantiateContext): mc.Param<unknown[]> {
    return ctx.api.Param.array(this.value.map((v) => v.instantiate(ctx)));
  }
  codegen(ctx: CodegenContext): string {
    return `${this.prefix(ctx)}.array([${this.value.map((v) => v.codegen(ctx)).join(', ')}])`;
  }
  toJSON(): ParamLiteral[] {
    return this.value.map((v) => v.toJSON());
  }
}

class ParamDateNode extends ParamNode<Date, ParamDate> {
  constructor(readonly date: string) {
    super();
  }

  instantiate(ctx: InstantiateContext): mc.Param<Date> {
    return ctx.api.Param.value(new Date(this.date));
  }
  codegen(ctx: CodegenContext): string {
    return `${this.prefix(ctx)}.value(new Date(${JSON.stringify(this.date)}))`;
  }
  toJSON(): ParamDate {
    return { date: this.date };
  }
}

export function parseParam(
  spec: ParamDefinition,
  ctx: ParseContext,
): ParamDateNode | ParamArrayNode | ParamValueNode | SelectionNode {
  const param = isObject(spec) && VALUE in spec ? spec.value : spec;
  if (isArray(param)) {
    return new ParamArrayNode(param.map((v) => ctx.maybeParam(v)));
  }
  if (!isObject(param)) {
    return new ParamValueNode(new LiteralNode(param));
  }
  if (SELECT in param && param.select !== VALUE) {
    return parseSelection(param, ctx);
  }
  if ('date' in param) {
    if (isISO8601(param.date)) {
      return new ParamDateNode(param.date);
    }
    ctx.error(`Invalid date format: ${param.date}`, spec);
  }
  ctx.error('Unrecognized param type:', spec);
}
