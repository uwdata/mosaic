import { astToModule } from '../ast-to-module.js';
import { SPEC } from '../constants.js';
import { ASTNode } from './ASTNode.js';

export class SpecNode extends ASTNode {
  constructor(meta, root, parseContext) {
    super(SPEC, [root]);
    this.root = root;
    this.meta = meta;
    this.parseContext = parseContext;
  }

  instantiate() {
    const { parseContext: ctx } = this;

    // parse data definitions
    // perform sequentially, as later datasets may be derived
    // for (const name in data) {
    //   const q = await parseData(name, data[name], this);
    //   if (q?.data) {
    //     ctx.datasets.set(name, q.data);
    //   } else if (q) {
    //     await coordinator().exec(q);
    //   }
    // }

    // parse param/selection definitions
    const activeParams = new Map;
    for (const [name, param] of ctx.params) {
      activeParams.set(name, param.instantiate(ctx));
    }

    this.activeParams = activeParams;
    const result = this.root.instantiate(ctx);
    this.activeParams = null;

    return result;
  }

  codegen(options) {
    return astToModule(this, options);
  }
}
