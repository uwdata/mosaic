import { SPEC } from '../constants.js';
import { ASTNode } from './ASTNode.js';

export class SpecNode extends ASTNode {
  constructor(root, meta, data, params, plotDefaults) {
    super(SPEC, [root]);
    this.root = root;
    this.meta = meta;
    this.data = data;
    this.params = params;
    this.plotDefaults = plotDefaults;
  }

  toJSON() {
    const { root, meta, plotDefaults } = this;
    const dataDefs = new Map(Object.entries(this.data));
    const paramDefs = new Map(Object.entries(this.params));
    const spec = {};

    if (meta) spec.meta = { ...meta };

    if (dataDefs?.size) {
      const data = spec.data = {};
      for (const [name, node] of dataDefs) {
        data[name] = node.toJSON();
      }
    }

    if (paramDefs?.size) {
      const params = spec.params = {};
      for (const [name, node] of paramDefs) {
        params[name] = node.toJSON();
      }
    }

    if (plotDefaults?.length) {
      const defaults = spec.plotDefaults = {};
      for (const node of plotDefaults) {
        Object.assign(defaults, node.toJSON());
      }
    }

    return Object.assign(spec, root.toJSON());
  }
}
