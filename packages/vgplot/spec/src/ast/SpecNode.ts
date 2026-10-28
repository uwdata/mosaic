// oxlint-disable no-unused-vars
import { SPEC } from '../constants.js';
import type { Spec, SpecComponent, SpecHead } from '../spec/Spec.js';
import { ASTNode } from './ASTNode.js';
import type { ParsedData } from './DataNode.js';
import type { ParamNode } from './ParamNode.js';
import type { PlotAttributeNode } from './PlotAttributeNode.js';
import type { SelectionNode } from './SelectionNode.js';

export type RootNode = ASTNode<HTMLElement | SVGSVGElement, void, SpecComponent>;

export class SpecNode extends ASTNode<unknown, void, Spec> {
  readonly root: RootNode;
  readonly meta: Spec['meta'];
  readonly config: Spec['config'];
  readonly data: Record<string, ParsedData>;
  readonly params: Record<string, SelectionNode | ParamNode>;
  readonly plotDefaults: PlotAttributeNode[];
  // oxlint-disable-next-line typescript/explicit-member-accessibility class-methods-use-this typescript/explicit-module-boundary-types typescript/explicit-function-return-type
  instantiate(_ctx) {
    throw new Error('Method not implemented.');
  }
  // oxlint-disable-next-line typescript/explicit-member-accessibility class-methods-use-this typescript/explicit-module-boundary-types typescript/explicit-function-return-type
  codegen(_ctx) {
    throw new Error('Method not implemented.');
  }
  constructor(
    root: RootNode,
    meta: Spec['meta'],
    config: Spec['config'],
    data: Record<string, ParsedData>,
    params: Record<string, SelectionNode | ParamNode>,
    plotDefaults: PlotAttributeNode[],
  ) {
    super(SPEC, [root]);
    this.root = root;
    this.meta = meta;
    this.config = config;
    this.data = data;
    this.params = params;
    this.plotDefaults = plotDefaults;
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
