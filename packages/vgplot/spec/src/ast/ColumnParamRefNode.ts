import type { ColumnRefNode } from '@uwdata/mosaic-sql';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { COLUMPARAMREF } from '../constants.js';
import type { ParamRef } from '../spec/Param.js';
import { ASTNode } from './ASTNode.js';
import type { ParamRefNode } from './ParamRefNode.js';

export class ColumnParamRefNode extends ASTNode<ColumnRefNode, string, ParamRef> {
  readonly param: ParamRefNode;
  constructor(param: ParamRefNode) {
    super(COLUMPARAMREF);
    this.param = param;
  }

  instantiate(ctx: InstantiateContext): ColumnRefNode {
    return ctx.api.column(this.param.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    return `${ctx.ns()}column(${this.param.codegen(ctx)})`;
  }

  toJSON(): ParamRef {
    return `$${this.param.toJSON}`;
  }
}
