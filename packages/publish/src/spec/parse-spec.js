import { componentMap } from './components.js';
import { transformMap } from './transforms.js';
import { error, isString, paramRef } from './util.js';
import { parseParam, ParamNode } from './ast/ParamNode.js';
import { ParamRefNode } from './ast/ParamRefNode.js';
import { SelectionNode } from './ast/SelectionNode.js';
import { parseAttribute } from './ast/PlotAttributeNode.js';
import { LiteralNode } from './ast/LiteralNode.js';
import { inputMap } from './inputs.js';
import { SpecNode } from './ast/SpecNode.js';
import { parseData } from './ast/DataNode.js';
import { DataRefNode } from './ast/DataRefNode.js';

export function parseSpec(spec, options) {
  spec = isString(spec) ? JSON.parse(spec) : spec;
  return new ParseContext(options).parse(spec);
}

export class ParseContext {
  constructor({
    components = componentMap(),
    transforms = transformMap(),
    inputs = inputMap(),
    params = [],
    datasets = [],
    baseURL = null
  } = {}) {
    this.components = components;
    this.transforms = transforms;
    this.inputs = inputs;
    this.params = new Map(params);
    this.datasets = new Map(datasets);
    this.baseURL = baseURL;
  }

  parse(spec) {
    // eslint-disable-next-line no-unused-vars
    const { meta, data = {}, plotDefaults = {}, params, ...rest } = spec;

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

    const root = this.parseComponent(rest);
    return new SpecNode({ ...meta }, root, this);
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
