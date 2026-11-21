import type * as vg from '@uwdata/vgplot';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { HSPACE } from '../constants.js';
import type { HSpace } from '../spec/HSpace.js';
import { ASTNode } from './ASTNode.js';

type VgHSpace = ReturnType<typeof vg.hspace>;

export class HSpaceNode extends ASTNode<VgHSpace, HSpace> {
  constructor(readonly value: number | string) {
    super(HSPACE);
  }

  instantiate(ctx: InstantiateContext): VgHSpace {
    return ctx.api[HSPACE](this.value);
  }

  codegen(ctx: CodegenContext): string {
    return `${ctx.tab()}${ctx.ns()}${this.type}(${ctx.stringify(this.value)})`;
  }

  toJSON(): HSpace {
    return { [HSPACE]: this.value };
  }
}

export function parseHSpace(spec: HSpace): HSpaceNode {
  return new HSpaceNode(spec[HSPACE]);
}
