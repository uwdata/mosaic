import { Param, Selection, coordinator } from '@uwdata/mosaic-core';
import { menu, search, slider, table } from '@uwdata/mosaic-inputs';
import {
  sql, avg, count, max, median, min, mode, quantile, sum,
  row_number, rank, dense_rank, percent_rank, cume_dist, ntile,
  lag, lead, first_value, last_value, nth_value,
  dateMonth, dateMonthDay, dateDay
} from '@uwdata/mosaic-sql';
import { feature, mesh } from 'topojson-client';

import { bin } from '../transforms/index.js'
import { hconcat, vconcat, hspace, vspace } from '../layout/index.js';
import { parse as isoparse } from 'isoformat';

import { from } from '../directives/data.js';
import { plot as _plot } from '../directives/plot.js';
import * as marks from '../directives/marks.js';
import * as legends from '../directives/legends.js';
import * as attributes from '../directives/attributes.js';
import * as interactors from '../directives/interactors.js';
import { Fixed } from '../symbols.js';

import {
  parseData, parseCSVData, parseJSONData,
  parseParquetData, parseTableData
} from './parse-data.js';
import {
  error, paramRef, toArray,
  isArray, isObject, isNumberOrString, isString, isFunction
} from './util.js';

const inputs = { menu, search, slider, table };

export const DefaultParamParsers = new Map([
  ['intersect', () => Selection.intersect()],
  ['crossfilter', () => Selection.crossfilter()],
  ['union', () => Selection.union()],
  ['single', () => Selection.single()],
  ['value', ({ date, value }, ctx) => Array.isArray(value)
    ? Param.array(value.map(v => ctx.maybeParam(v)))
    : Param.value(isoparse(date, value))]
]);

export const DefaultSpecParsers = new Map([
  ['plot', { type: isArray, parse: parsePlot }],
  ['mark', { type: isString, parse: parseNakedMark }],
  ['legend', { type: isString, parse: parseLegend }],
  ['hconcat', { type: isArray, parse: parseHConcat }],
  ['vconcat', { type: isArray, parse: parseVConcat }],
  ['hspace', { type: isNumberOrString, parse: parseHSpace }],
  ['vspace', { type: isNumberOrString, parse: parseVSpace }],
  ['input', { type: isString, parse: parseInput }]
]);

export const DefaultDataFormats = new Map([
  ['csv', parseCSVData],
  ['json', parseJSONData],
  ['geojson', parseGeoJSONData],
  ['topojson', parseTopoJSONData],
  ['parquet', parseParquetData],
  ['table', parseTableData]
]);

export const DefaultTransforms = new Map([
  ['avg', avg],
  ['bin', bin],
  ['count', count],
  ['dateMonth', dateMonth],
  ['dateMonthDay', dateMonthDay],
  ['dateDay', dateDay],
  ['bin', bin],
  ['max', max],
  ['median', median],
  ['min', min],
  ['mode', mode],
  ['quantile', quantile],
  ['sum', sum],
  ['row_number', row_number],
  ['rank', rank],
  ['dense_rank', dense_rank],
  ['percent_rank', percent_rank],
  ['cume_dist', cume_dist],
  ['ntile', ntile],
  ['lag', lag],
  ['lead', lead],
  ['first_value', first_value],
  ['last_value', last_value],
  ['nth_value', nth_value]
]);

export const DefaultMarks = new Map(Object.entries(marks));
export const DefaultInputs = new Map(Object.entries(inputs));
export const DefaultLegends = new Map(Object.entries(legends));
export const DefaultAttributes = new Map(Object.entries(attributes));
export const DefaultInteractors = new Map(Object.entries(interactors));

export function parseSpec(spec, options) {
  spec = isString(spec) ? JSON.parse(spec) : spec;
  return new ParseContext(options).parse(spec);
}

export class ParseContext {
  constructor({
    specParsers = DefaultSpecParsers,
    paramParsers = DefaultParamParsers,
    dataFormats = DefaultDataFormats,
    transforms = DefaultTransforms,
    attributes = DefaultAttributes,
    interactors = DefaultInteractors,
    legends = DefaultLegends,
    inputs = DefaultInputs,
    marks = DefaultMarks,
    params = [],
    datasets = [],
    baseURL = null
  } = {}) {
    this.specParsers = specParsers;
    this.paramParsers = paramParsers;
    this.dataFormats = dataFormats;
    this.transforms = transforms;
    this.attributes = attributes;
    this.interactors = interactors;
    this.legends = legends;
    this.inputs = inputs;
    this.marks = marks;
    this.params = new Map(params);
    this.datasets = new Map(datasets);
    this.baseURL = baseURL;
    this.postQueue = [];
  }

  after(fn) {
    this.postQueue.push(fn);
  }

  maybeParam(value, ctr = () => Param.value()) {
    const { params } = this;
    const name = paramRef(value);

    if (name) {
      if (!params.has(name)) {
        const p = ctr();
        params.set(name, p);
        return p;
      } else {
        return params.get(name);
      }
    }
    return value;
  }

  maybeSelection(value) {
    return this.maybeParam(value, () => Selection.intersect());
  }

  maybeTransform(value) {
    if (isObject(value)) {
      return value.expr
        ? parseExpression(value, this)
        : parseTransform(value, this);
    }
  }

  async parse(input) {
    // eslint-disable-next-line no-unused-vars
    const { meta, data = {}, plotDefaults = {}, params, ...spec } = input;

    // parse data definitions
    // perform sequentially, as later datasets may be derived
    for (const name in data) {
      const q = await parseData(name, data[name], this);
      if (q?.data) {
        this.datasets.set(name, q.data);
      } else if (q) {
        await coordinator().exec(q);
      }
    }

    // parse default attributes
    this.plotDefaults = Object.keys(plotDefaults)
      .map(key => parseAttribute(plotDefaults, key, this));

    // parse param/selection definitions
    for (const name in params) {
      this.params.set(name, parseParam(params[name], this));
    }

    const result = parseComponent(spec, this);
    this.postQueue.forEach(fn => fn());
    this.postQueue = [];
    this.plotDefaults = {};

    return result;
  }
}

async function retrieveJSONData(spec) {
  const { data, file } = spec;
  return data || await fetch(file).then(r => r.json());
}

async function parseGeoJSONData(name, spec) {
  return { data: await retrieveJSONData(spec) };
}

async function parseTopoJSONData(name, spec) {
  const json = await retrieveJSONData(spec);
  let data;

  if (spec.feature) {
    data = feature(json, json.objects[spec.feature]);
  } else {
    const object = spec.mesh ? json.objects[spec.mesh] : undefined;
    const filter = ({
      interior: (a, b) => a !== b,
      exterior: (a, b) => a === b
    })[spec.filter];
    data = mesh(json, object, filter);
  }

  return { data: data && data.features || [data] };
}

function parseParam(param, ctx) {
  param = isObject(param) ? param : { value: param };
  const { select = 'value' } = param;
  const parser = ctx.paramParsers.get(select);
  if (!parser) {
    error(`Unrecognized param type: ${select}`, param);
  }
  return parser(param, ctx);
}

function parseComponent(spec, ctx) {
  for (const [key, { type, parse }] of ctx.specParsers) {
    const value = spec[key];
    if (value != null) {
      if (type(value)) {
        return parse(spec, ctx);
      } else {
        error(`Invalid property type: ${key}`, spec);
      }
    }
  }
  error(`Invalid specification.`, spec);
}

function parseHSpace(spec) {
  return hspace(spec.hspace);
}

function parseVSpace(spec) {
  return vspace(spec.vspace);
}

function parseInput(spec, ctx) {
  const { input, ...options } = spec;
  const fn = ctx.inputs.get(input);
  if (!isFunction(fn)) {
    error(`Unrecognized input: ${input}`, spec);
  }
  for (const key in options) {
    options[key] = ctx.maybeSelection(options[key]);
  }
  return fn(options);
}

function parseVConcat(spec, ctx) {
  return vconcat(spec.vconcat.map(s => parseComponent(s, ctx)));
}

function parseHConcat(spec, ctx) {
  return hconcat(spec.hconcat.map(s => parseComponent(s, ctx)));
}

function parsePlot(spec, ctx) {
  const { plot, ...attributes } = spec;
  const attrs = ctx.plotDefaults.concat(
    Object.keys(attributes).map(key => parseAttribute(spec, key, ctx))
  );
  const entries = plot.map(e => parseEntry(e, ctx));
  return _plot(attrs, entries);
}

function parseNakedMark(spec, ctx) {
  return parsePlot({ plot: [spec] }, ctx);
}

function parseLegend(spec, ctx) {
  const { legend, ...options } = spec;
  const key = `${legend}Legend`;
  const fn = ctx.legends.get(key);
  if (!isFunction(fn)) {
    error(`Unrecognized legend type: ${legend}`, spec);
  }
  for (const key in options) {
    options[key] = ctx.maybeSelection(options[key]);
  }
  return fn(options);
}

function parseAttribute(spec, name, ctx) {
  const fn = ctx.attributes.get(name);
  if (!isFunction(fn)) {
    error(`Unrecognized attribute: ${name}`, spec);
  }
  const value = spec[name];
  const arg = value === 'Fixed' ? Fixed : ctx.maybeParam(value);
  return fn(arg);
}

function parseEntry(spec, ctx) {
  return isString(spec.mark) ? parseMark(spec, ctx)
    : isString(spec.legend) ? parseLegend(spec, ctx)
    : isString(spec.select) ? parseInteractor(spec, ctx)
    : error(`Invalid plot entry.`, spec);
}

function parseMark(spec, ctx) {
  const { mark, data, ...options } = spec;
  const fn = ctx.marks.get(mark);
  if (!isFunction(fn)) {
    error(`Unrecognized mark type: ${mark}`, spec);
  }

  const input = parseMarkData(data, ctx);
  for (const key in options) {
    options[key] = parseMarkOption(options[key], ctx);
  }

  return input ? fn(input, options) : fn(options);
}

function parseMarkData(spec, ctx) {
  if (!spec) return null; // no data, likely a decoration mark
  if (isArray(spec)) return spec; // data provided directly
  const { from: table, ...options } = spec;
  if (ctx.datasets.has(table)) {
    // client-managed data, simply pass through
    return ctx.datasets.get(table);
  } else {
    // source-managed data, create from descriptor
    for (const key in options) {
      options[key] = ctx.maybeSelection(options[key]);
    }
    return from(table, options);
  }
}

function parseMarkOption(spec, ctx) {
  return ctx.maybeTransform(spec) || ctx.maybeParam(spec);
}

function parseInteractor(spec, ctx) {
  const { select, ...options } = spec;
  const fn = ctx.interactors.get(select);
  if (!isFunction(fn)) {
    error(`Unrecognized interactor type: ${select}`, spec);
  }
  for (const key in options) {
    options[key] = ctx.maybeSelection(options[key]);
  }
  return fn(options);
}

function parseExpression(spec, ctx) {
  const { expr, label } = spec;
  const tokens = expr.split(/(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$\w+)/g);
  const spans = [''];
  const exprs = [];

  for (let i = 0, k = 0; i < tokens.length; ++i) {
    const tok = tokens[i];
    if (tok.startsWith('$')) {
      exprs[k] = ctx.maybeParam(tok);
      spans[++k] = '';
    } else {
      spans[k] += tok;
    }
  }

  return sql(spans, ...exprs).annotate({ label });
}

function parseTransform(spec, ctx) {
  const { transforms } = ctx;
  let name;
  for (const key in spec) {
    if (transforms.has(key)) {
      name = key;
    }
  }
  if (!name) {
    return; // return undefined to signal no transform
  }

  const func = transforms.get(name);
  const args = name === 'count' || name == null ? [] : toArray(spec[name]);
  let expr = func(...args);
  if (spec.distinct) expr = expr.distinct();
  if (spec.order) {
    const p = toArray(spec.order).map(v => ctx.maybeParam(v));
    expr = expr.orderby(p);
  }
  if (spec.partition) {
    const p = toArray(spec.partition).map(v => ctx.maybeParam(v));
    expr = expr.partitionby(p);
  }
  if (spec.rows) {
    expr = expr.rows(ctx.maybeParam(spec.rows));
  } else if (spec.range) {
    expr = expr.range(ctx.maybeParam(spec.range));
  }

  return expr;
}
