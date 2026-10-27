import type { Param } from '@uwdata/mosaic-core';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { PARAMREF } from '../constants.js';
import type { ParamRef } from '../spec/Param.js';
import { toParamRef } from '../util.js';
import { ASTNode } from './ASTNode.js';

export class ParamRefNode extends ASTNode {
  readonly name: string;
  constructor(name: string) {
    super(PARAMREF);
    this.name = name;
  }

  instantiate(ctx: InstantiateContext): Param<unknown> | undefined {
    return ctx.activeParams?.get(this.name);
  }

  // oxlint-disable-next-line no-unused-vars
  codegen(_ctx: CodegenContext): ParamRef {
    return toParamRef(this.name);
  }

  toJSON(): ParamRef {
    return toParamRef(this.name);
  }
}
