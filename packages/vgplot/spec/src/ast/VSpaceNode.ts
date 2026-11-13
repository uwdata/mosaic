import type * as vg from '@uwdata/vgplot';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { VSPACE } from '../constants.js';
import type { VSpace } from '../spec/VSpace.js';
import { ASTNode } from './ASTNode.js';

type VgVSpace = ReturnType<typeof vg.vspace>;

export class VSpaceNode extends ASTNode<VgVSpace, VSpace> {
  constructor(readonly value: number | string) {
    super(VSPACE);
  }

  instantiate(ctx: InstantiateContext): VgVSpace {
    return ctx.api[VSPACE](this.value);
  }

  codegen(ctx: CodegenContext): string {
    return `${ctx.tab()}${ctx.ns()}${this.type}(${ctx.stringify(this.value)})`;
  }

  toJSON(): VSpace {
    return { [VSPACE]: this.value };
  }
}

export function parseVSpace(spec: VSpace): VSpaceNode {
  return new VSpaceNode(spec[VSPACE]);
}
