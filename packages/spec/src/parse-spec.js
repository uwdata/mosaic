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

import { error, isString, paramRef } from './util.js';

/**
 * Parse a Mosaic specification to an AST (abstract syntax tree).
 * @param {object|string} spec The input specification as an object
 *  or JSON string.
 * @param {object} [options] Optional parse options object.
 * @returns {SpecNode} The top-level AST spec node.
 */
export function parseSpec(spec, options) {
  spec = isString(spec) ? JSON.parse(spec) : spec;
  return new ParseContext(options).parse(spec);
}

export class ParseContext {
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
