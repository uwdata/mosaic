import { parseData } from './ast/DataNode.js';
import type { ParsedData } from './ast/DataNode.js';
import { LiteralNode } from './ast/LiteralNode.js';
import { parseParam, ParamNode } from './ast/ParamNode.js';
import { ParamRefNode } from './ast/ParamRefNode.js';
import type { PlotAttributeNode } from './ast/PlotAttributeNode.js';
import { parseAttribute } from './ast/PlotAttributeNode.js';
import { SelectionNode } from './ast/SelectionNode.js';
import type { RootNode } from './ast/SpecNode.js';
import { SpecNode } from './ast/SpecNode.js';
import { componentMap } from './config/components.js';
import { inputNames } from './config/inputs.js';
import { plotNames } from './config/plots.js';
import { transformNames } from './config/transforms.js';
import type { Spec, SpecComponent } from './spec/index.js';
import { error, paramRef } from './util.js';

interface PlotNames {
  attributes: Set<string>;
  interactors: Set<string>;
  legends: Set<string>;
  marks: Set<string>;
}

type ComponentsMap = Map<string, (arg0: RootComponent, arg1: ParseContext) => RootNode>;
type RootComponent = SpecComponent & { $schema?: string };

/**
 * Parse a Mosaic specification to an AST (abstract syntax tree).
 *
 * @param spec The input specification.
 * @param [options] Optional parse options object.
 * @param [options.components] Map of component names to parse functions.
 * @param [options.transforms] The names of allowed transform functions.
 * @param [options.inputs] The names of supported input widgets.
 * @param [options.plot] The names of supported plot elements.
 * @param [options.params] An array of [name, node] pairs of pre-parsed Param or Selection AST
 *   nodes.
 * @param [options.datasets] An array of [name, node] pairs of pre-parsed dataset definition AST
 *   nodes.
 * @returns {SpecNode} The top-level AST spec node.
 */
export function parseSpec(
  spec: Spec,
  options: {
    components?: ComponentsMap;
    transforms?: Set<string>;
    inputs?: Set<string>;
    plot?: PlotNames;
    params?: [string, SelectionNode | ParamNode][];
    datasets?: [string, ParsedData][];
  } = {},
): SpecNode {
  // oxlint-disable-next-line no-use-before-define
  return new ParseContext(options).parse(spec);
}

export class ParseContext {
  components: ComponentsMap;
  transforms: Set<string>;
  inputs: Set<string>;
  plot: PlotNames;
  params: Map<string, SelectionNode | ParamNode>;
  datasets: Map<string, ParsedData>;
  plotDefaults: PlotAttributeNode[];
  /**
   * Create a new parser context.
   *
   * @param [options]
   * @param [options.components] Map of component names to parse functions.
   * @param [options.transforms] The names of allowed transform functions.
   * @param [options.inputs] The names of supported input widgets.
   * @param [options.plot] The names of supported plot elements.
   * @param [options.params] An array of [name, node] pairs of pre-parsed Param or Selection AST
   *   nodes.
   * @param [options.datasets] An array of [name, node] pairs of pre-parsed dataset definition AST
   *   nodes.
   */
  constructor({
    components = componentMap(),
    transforms = transformNames(),
    inputs = inputNames(),
    plot = plotNames(),
    params = [],
    datasets = [],
  }: {
    components?: ComponentsMap;
    transforms?: Set<string>;
    inputs?: Set<string>;
    plot?: PlotNames;
    params?: [string, SelectionNode | ParamNode][];
    datasets?: [string, ParsedData][];
  } = {}) {
    this.components = components;
    this.transforms = transforms;
    this.inputs = inputs;
    this.plot = plot;
    this.params = new Map(params);
    this.datasets = new Map(datasets);
    this.plotDefaults = [];
  }

  parse(spec: Spec): SpecNode {
    const { meta, config, data = {}, params, plotDefaults = {}, ...root } = spec;

    // Parse data definitions
    // oxlint-disable-next-line guard-for-in
    for (const name in data) {
      this.datasets.set(name, parseData(name, data[name], this));
    }

    // Parse default attributes
    this.plotDefaults = Object.entries(plotDefaults).map(([key, value]) =>
      parseAttribute(key, value, this),
    );

    // Parse param/selection definitions
    // oxlint-disable-next-line guard-for-in
    for (const name in params) {
      this.params.set(name, parseParam(params[name], this));
    }

    return new SpecNode(
      this.parseComponent(root),
      // oxlint-disable-next-line no-undefined
      meta ? { ...meta } : undefined,
      // oxlint-disable-next-line no-undefined
      config ? { ...config } : undefined,
      Object.fromEntries(this.datasets),
      Object.fromEntries(this.params),
      this.plotDefaults,
    );
  }

  parseComponent(spec: RootComponent): RootNode {
    for (const [key, parse] of this.components) {
      const value = spec[key];
      // oxlint-disable-next-line no-eq-null unicorn/no-null
      if (value != null) {
        return parse(spec, this);
      }
    }
    this.error('Invalid specification.', spec);
  }

  /**
   * Test if a value is a param reference, if so, generates a parameter definition as needed and
   * returns a new ParamRefNode. Otherwise, returns a LiteralNode for the given value.
   *
   * @param value The value to test.
   * @returns An AST node for the input value.
   */
  maybeParam(value: unknown): ParamRefNode | LiteralNode | null {
    const name = paramRef(value);
    return name ? this.paramRef(name) : new LiteralNode(value);
  }

  /**
   * Test if a value is a param reference, if so, generates a selection definition as needed and
   * returns a new ParamRefNode. Otherwise, returns a LiteralNode for the given value.
   *
   * @param value The value to test.
   * @returns An AST node for the input value.
   */
  maybeSelection(value: unknown): ParamRefNode | LiteralNode {
    const name = paramRef(value);
    return name
      ? // @ts-expect-error requires overloads in `this.selectionRef` to filter out null
        this.selectionRef(name)
      : new LiteralNode(value);
  }

  /**
   * Create a parameter reference. Generates a parameter definition if needed and returns a new
   * ParamRefNode.
   *
   * @param name The parameter name.
   * @param makeNode A Param or Selection AST node constructor.
   * @returns A node referring to the param or selection.
   */
  paramRef(
    name: string,
    makeNode: () => ParamNode | SelectionNode = () => new ParamNode(),
  ): ParamRefNode | null {
    const { params } = this;
    if (!name) {
      // oxlint-disable-next-line unicorn/no-null
      return null;
    }
    let p = params.get(name);
    if (!p) {
      p = makeNode();
      params.set(name, p);
    }
    return new ParamRefNode(name);
  }

  /**
   * Create a selection reference. Generates a selection definition if needed and returns a new
   * ParamRefNode. Returns null if a non-selection parameter with the same name already exists and
   * _strict_ is true.
   *
   * @param name The selection name.
   * @param strict Indicates if this method may return param references (false, default) or only
   *   selection references (true).
   * @returns A node referring to the param or selection.
   */
  // oxlint-disable-next-line typescript/no-inferrable-types
  selectionRef(name: string, strict: boolean = false): ParamRefNode | null {
    const p = this.params.get(name);
    if (strict && p && !(p instanceof SelectionNode)) {
      // oxlint-disable-next-line unicorn/no-null
      return null;
    }
    return this.paramRef(name, () => new SelectionNode());
  }

  // oxlint-disable-next-line class-methods-use-this
  error(message: string, data: unknown): never {
    error(message, data);
  }
}
