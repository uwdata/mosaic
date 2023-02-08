import { Param, Selection, coordinator, sqlFrom } from '@uwdata/mosaic-core';
import { Query, avg, count, expr, max, median, min, mode, quantile, sum } from '@uwdata/mosaic-sql';
import { bin, dateMonth, dateMonthDay, dateDay } from './transforms/index.js'

import { from } from './directives/data.js';
import * as plots from './directives/plots.js';
import * as marks from './directives/marks.js';
import * as inputs from './directives/inputs.js';
import * as legends from './directives/legends.js';
import * as selections from './directives/selections.js';
import * as attributes from './directives/attributes.js';
import { Fixed } from './symbols';

export const DefaultParamParsers = new Map([
  ['intersect', () => Selection.intersect()],
  ['crossfilter', () => Selection.crossfilter()],
  ['union', () => Selection.union()],
  ['single', () => Selection.single()],
  ['value', v => new Param(v)]
]);

export const DefaultSpecParsers = new Map([
  ['plot', { type: isArray, parse: parsePlot }],
  ['mark', { type: isString, parse: parseNakedMark }],
  ['legend', { type: isString, parse: parseLegend }],
  ['hconcat', { type: isArray, parse: parseHConcat }],
  ['vconcat', { type: isArray, parse: parseVConcat }],
  ['hspace', { type: isNumber, parse: parseHSpace }],
  ['vspace', { type: isNumber, parse: parseVSpace }],
  ['input', { type: isString, parse: parseInput }]
]);

export const DefaultFormats = new Map([
  ['table', parseTableData],
  ['parquet', parseParquetData],
  ['csv', parseCSVData],
  ['json', parseJSONData]
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
  ['sum', sum]
]);

export const DefaultInputs = new Map(Object.entries(inputs));
export const DefaultLegends = new Map(Object.entries(legends));
export const DefaultAttributes = new Map(Object.entries(attributes));
export const DefaultSelections = new Map(Object.entries(selections));

export function parseJSON(spec, options) {
  spec = isString(spec) ? JSON.parse(spec) : spec;
  return new JSONParseContext(options).parse(spec);
}

export class JSONParseContext {
  constructor({
    specParsers = DefaultSpecParsers,
    paramParsers = DefaultParamParsers,
    formats = DefaultFormats,
    transforms = DefaultTransforms,
    selections = DefaultSelections,
    attributes = DefaultAttributes,
    legends = DefaultLegends,
    inputs = DefaultInputs,
    params = []
  } = {}) {
    this.specParsers = specParsers;
    this.paramParsers = paramParsers;
    this.formats = formats;
    this.transforms = transforms;
    this.selections = selections;
    this.attributes = attributes;
    this.legends = legends;
    this.inputs = inputs;
    this.params = new Map(params);
    this.postQueue = [];
  }

  after(fn) {
    this.postQueue.push(fn);
  }

  maybeParam(value, ctr = () => new Param()) {
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
      if (value.expr) {
        return expr(value.expr, [], value.label);
      } else {
        const { transforms } = this;
        const [ key ] = Object.keys(value);
        const fn = transforms.get(key);
        if (fn) {
          const args = key === 'count' ? [] : [value[key]].flat();
          return fn(...args);
        }
      }
    }
  }

  async parse(input) {
    const { data = {}, defaults = {}, params, ...spec } = input;

    // parse data definitions
    await Promise.allSettled(
      Object.keys(data).map(async name => {
        const q = await parseData(name, data[name], this);
        return q ? coordinator().exec(q) : null;
      })
    );

    // parse default attributes
    this.defaults = Object.keys(defaults)
      .map(key => parseAttribute(defaults, key, this));

    // parse param/selection definitions
    for (const name in params) {
      this.params.set(name, parseParam(params[name], this));
    }

    const result = parseSpec(spec, this);
    this.postQueue.forEach(fn => fn());
    this.postQueue = [];
    this.defaults = {};

    return result;
  }

  createFrom(name, from, select, where) {
    const query = Query.select(select).from(from).where(where);
    return this.create(name, query);
  }

  create(name, query) {
    return `CREATE TEMP TABLE IF NOT EXISTS "${name}" AS ${query}`;
  }
}

function parseData(name, spec, ctx) {
  if (isArray(spec)) spec = { format: 'json', data: spec };
  if (isString(spec)) spec = { format: 'table', query: spec };
  const format = inferFormat(spec);
  const parse = ctx.formats.get(format);
  if (parse) {
    return parse(name, spec, ctx);
  } else {
    error(`Unrecognized data format.`, spec);
  }
}

function inferFormat(spec) {
  return spec.format
    || fileExtension(spec.file)
    || 'table';
}

function fileExtension(file) {
  const idx = file?.lastIndexOf('.');
  return idx > 0 ? file.slice(idx + 1) : null;
}

function parseTableData(name, spec, ctx) {
  if (spec.query) {
    return ctx.create(name, spec.query);
  }
}

function parseParquetData(name, spec, ctx) {
  const { file, select = '*' } = spec;
  return ctx.createFrom(
    name,
    expr(`read_parquet('${file}')`),
    select
  );
}

function parseCSVData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { file, format, select = '*', ...options } = spec;
  const opt = Object.entries({ sample_size: -1, ...options })
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value).toUpperCase()
        : t === 'string' ? `'${value}'`
        : value;
      return `${key.toUpperCase()}=${v}`;
    })
    .join(', ');
  return ctx.createFrom(
    name,
    expr(`read_csv_auto('${file}', ${opt})`),
    select
  );
}

async function parseJSONData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { data, file, select = '*' } = spec;
  const json = data || await fetch(file).then(r => r.json());
  return ctx.createFrom(name, expr(sqlFrom(json)), select);
}

function parseParam(param, ctx) {
  param = isObject(param) ? param : { value: param };
  const { select = 'value', value } = param;
  const parser = ctx.paramParsers.get(select);
  if (!parser) {
    error(`Unrecognized param type: ${select}`, param);
  }
  return parser(value);
}

function parseSpec(spec, ctx) {
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
  return plots.hspace(+spec.hspace);
}

function parseVSpace(spec) {
  return plots.vspace(+spec.vspace);
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
  return plots.vconcat(spec.vconcat.map(s => parseSpec(s, ctx)));
}

function parseHConcat(spec, ctx) {
  return plots.hconcat(spec.hconcat.map(s => parseSpec(s, ctx)));
}

function parsePlot(spec, ctx) {
  const { plot, ...attributes } = spec;
  const attrs = ctx.defaults.concat(
    Object.keys(attributes).map(key => parseAttribute(spec, key, ctx))
  );
  const entries = plot.map(e => parseEntry(e, ctx));
  return plots.plot(attrs, entries);
}

function parseNakedMark(spec, ctx) {
  return parsePlot({ plot: [spec] }, ctx);
}

function parseLegend(spec, ctx) {
  const { legend, ...options } = spec;
  const key = `legend${legend[0].toUpperCase()}${legend.slice(1)}`;
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
    : isString(spec.select) ? parseSelection(spec, ctx)
    : error(`Invalid plot entry.`, spec);
}

function parseMark(spec, ctx) {
  const { mark, data, ...options } = spec;

  const fn = marks[mark];
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
  for (const key in options) {
    options[key] = ctx.maybeSelection(options[key]);
  }
  return from(table, options);
}

function parseMarkOption(spec, ctx) {
  return ctx.maybeTransform(spec) || ctx.maybeParam(spec);
}

function parseSelection(spec, ctx) {
  const { select, ...options } = spec;
  const fn = ctx.selections.get(select);
  if (!isFunction(fn)) {
    error(`Unrecognized selection type: ${select}`, spec);
  }
  for (const key in options) {
    options[key] = ctx.maybeSelection(options[key]);
  }
  return fn(options);
}

// -----

function paramRef(value) {
  const type = typeof value;
  return type === 'object' ? value?.param
    : type === 'string' ? paramStr(value)
    : null;
}

function paramStr(value) {
  return value?.[0] === '$' ? value.slice(1) : null;
}

function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !isArray(value);
}

function isNumber(value) {
  return typeof value === 'number';
}

function isString(value) {
  return typeof value === 'string';
}

function isFunction(value) {
  return typeof value === 'function';
}

function error(message, data) {
  throw Object.assign(Error(message), { data });
}
