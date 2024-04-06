import { parseData } from './ast/DataNode.js'
import { LiteralNode } from './ast/LiteralNode.js';
import { parseParam, ParamNode } from './ast/ParamNode.js';
import { ParamRefNode } from './ast/ParamRefNode.js';
import { parseAttribute } from './ast/PlotAttributeNode.js';
import { SelectionNode } from './ast/SelectionNode.js';
import { SpecNode } from './ast/SpecNode.js';
import { componentMap } from './config/components.js';
import { inputNames } from './config/inputs.js';
import { plotNames } from './config/plots.js';
import { transformNames } from './config/transforms.js';
import { error, paramRef } from './util.js';

/**
 * @typedef {{
 *   attributes: Set<string>;
 *   interactors: Set<string>;
 *   legends: Set<string>;
 *   marks: Set<string>;
 * }} PlotNames names for supported plot elements
 */

/**
 * Parse a Mosaic specification to an AST (abstract syntax tree).
 * @param {import('./spec/Spec.js').Spec} spec The input specification.
 * @param {object} [options] Optional parse options object.
 * @param {Map<string, Function>} [options.components] Map of component names to parse functions.
 * @param {Set<string>} [options.transforms] The names of allowed transform functions.
 * @param {Set<string>} [options.inputs] The names of supported input widgets.
 * @param {PlotNames} [options.plot] The names of supported plot elements.
 * @param {any[]} [options.params] An array of [name, node] pairs of pre-parsed
 *  Param or Selection AST nodes.
 * @param {any[]} [options.datasets] An array of [name, node] pairs of pre-parsed
 *  dataset definition AST nodes.
 * @returns {SpecNode} The top-level AST spec node.
 */
export function parseSpec(spec, options) {
  return new ParseContext(options).parse(spec);
}

export class ParseContext {
  /**
   * Create a new parser context.
   * @param {object} [options]
   * @param {Map<string, Function>} [options.components] Map of component names to parse functions.
   * @param {Set<string>} [options.transforms] The names of allowed transform functions.
   * @param {Set<string>} [options.inputs] The names of supported input widgets.
   * @param {PlotNames} [options.plot] The names of supported plot elements.
   * @param {any[]} [options.params] An array of [name, node] pairs of pre-parsed
   *  Param or Selection AST nodes.
   * @param {any[]} [options.datasets] An array of [name, node] pairs of pre-parsed
   *  dataset definition AST nodes.
   */
  constructor({
    components = componentMap(),
    transforms = transformNames(),
    inputs = inputNames(),
    plot = plotNames(),
    params = [],
    datasets = []
  } = {}) {
    this.components = components;
    this.transforms = transforms;
    this.inputs = inputs;
    this.plot = plot;
    this.params = new Map(params);
    this.datasets = new Map(datasets);
  }

  parse(spec) {
    // eslint-disable-next-line no-unused-vars
    const {
      meta,
      config,
      data = {},
      params,
      plotDefaults = {},
      ...root
    } = spec;

    // parse data definitions
    for (const name in data) {
      this.datasets.set(name, parseData(name, data[name], this));
    }

    // parse default attributes
    this.plotDefaults = Object.entries(plotDefaults)
      .map(([key, value]) => parseAttribute(key, value, this));

    // parse param/selection definitions
    for (const name in params) {
      this.params.set(name, parseParam(params[name], this));
    }

    return new SpecNode(
      this.parseComponent(root),
      meta ? { ...meta } : undefined,
      config ? { ...config } : undefined,
      Object.fromEntries(this.datasets),
      Object.fromEntries(this.params),
      this.plotDefaults
    );
  }

  parseComponent(spec) {
    for (const [key, parse] of this.components) {
      const value = spec[key];
      if (value != null) {
        return parse(spec, this);
      }
    }
    this.error(`Invalid specification.`, spec);
  }

  /**
   * Test if a value is param reference, if so, generate a paramter definition
   * as needed and return a new ParamRefNode. Otherwise, return a LiteralNode.
   * @param {*} value The value to test.
   * @param {() => ParamNode | SelectionNode} [makeNode] A Param of Selection AST
   *  node constructor.
   * @returns {ParamRefNode|LiteralNode} An AST node for the input value.
   */
  maybeParam(value, makeNode = () => new ParamNode) {
    const { params } = this;
    const name = paramRef(value);

    if (name) {
      if (!params.has(name)) {
        const p = makeNode();
        params.set(name, p);
      }
      return new ParamRefNode(name);
    }
    return new LiteralNode(value);
  }

  maybeSelection(value) {
    return this.maybeParam(value, () => new SelectionNode);
  }

  error(message, data) {
    error(message, data);
  }
}
