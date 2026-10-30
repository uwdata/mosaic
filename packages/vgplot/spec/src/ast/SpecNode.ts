import { SPEC } from '../constants.js';
import type { HConcat } from '../spec/HConcat.js';
import type { Plot } from '../spec/Plot.js';
import type { Spec, SpecComponent, SpecHead } from '../spec/Spec.js';
import type { VConcat } from '../spec/VConcat.js';
import type { ASTNode } from './ASTNode.js';
import { ParentNode } from './ASTNode.js';
import type { DataNode } from './DataNode.js';
import type { ParamNode } from './ParamNode.js';
import type { PlotAttributeNode } from './PlotAttributeNode.js';
import type { SelectionNode } from './SelectionNode.js';

type HasChildren = Plot | HConcat | VConcat;
type NoChildren = Exclude<SpecComponent, HasChildren>;
type DomElement = HTMLElement | SVGSVGElement;

export type RootNode = ParentNode<DomElement, HasChildren> | ASTNode<DomElement, NoChildren>;

export class SpecNode extends ParentNode<unknown, Spec> {
  // oxlint-disable-next-line class-methods-use-this no-unused-vars
  instantiate(_ctx: unknown): never {
    throw new Error('Method not implemented.');
  }
  // oxlint-disable-next-line class-methods-use-this no-unused-vars
  codegen(_ctx: unknown): never {
    throw new Error('Method not implemented.');
  }
  constructor(
    readonly root: RootNode,
    readonly meta: Spec['meta'],
    readonly config: Spec['config'],
    readonly data: Record<string, DataNode>,
    readonly params: Record<string, SelectionNode | ParamNode>,
    readonly plotDefaults: PlotAttributeNode[],
  ) {
    super(SPEC, [root]);
  }

  // oxlint-disable-next-line max-statements
  toJSON(): Spec {
    const { root, meta, config, plotDefaults } = this;
    const dataDefs = new Map(Object.entries(this.data));
    const paramDefs = new Map(Object.entries(this.params));
    const head: SpecHead = {};

    if (meta) {
      head.meta = { ...meta };
    }
    if (config) {
      head.config = { ...config };
    }

    if (dataDefs?.size) {
      // oxlint-disable-next-line no-multi-assign
      const data = (head.data = {});
      for (const [name, node] of dataDefs) {
        data[name] = node.toJSON();
      }
    }

    if (paramDefs?.size) {
      // oxlint-disable-next-line no-multi-assign
      const params = (head.params = {});
      for (const [name, node] of paramDefs) {
        params[name] = node.toJSON();
      }
    }

    if (plotDefaults?.length) {
      // oxlint-disable-next-line no-multi-assign
      const defaults = (head.plotDefaults = {});
      for (const node of plotDefaults) {
        Object.assign(defaults, node.toJSON());
      }
    }

    return Object.assign(head, root.toJSON());
  }
}
