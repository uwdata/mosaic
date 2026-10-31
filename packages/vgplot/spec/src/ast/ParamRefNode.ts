import type * as mc from '@uwdata/mosaic-core';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { PARAMREF } from '../constants.js';
import type { ParamRef } from '../spec/Param.js';
import { toParamRef, error } from '../util.js';
import { ASTNode } from './ASTNode.js';

export class ParamRefNode extends ASTNode {
  constructor(readonly name: string) {
    super(PARAMREF);
  }

  instantiate(ctx: InstantiateContext): mc.Param<unknown> {
    const param = ctx.activeParams.get(this.name);
    return param ?? error(`${this.name} is not an active param`, param);
  }

  codegen(_ctx: CodegenContext): ParamRef {
    return toParamRef(this.name);
  }

  toJSON(): ParamRef {
    return toParamRef(this.name);
  }
}
