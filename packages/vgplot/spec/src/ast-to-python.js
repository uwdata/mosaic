import { camelCaseToSnake } from './util.js';
import {
  PYTHON_KEYWORDS,
  kwarg,
  INTERACTOR_KEY_MAP,
  LEGEND_KEY_MAP,
  inputArgName,
  literal,
  indentLine,
} from './python-codegen.js';

/** Build snake_cased, keyword-safe kwargs for an options object. */
function buildArgs(opts, ctx, keyMap = null) {
  return Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => kwarg((keyMap && keyMap[k]) || camelCaseToSnake(k), literal(v, 0, ctx)));
}

/**
 * Generate Python code for a Mosaic spec AST using the vgplot Python DSL.
 * Preamble:  import vgplot as vg
 * Final var: spec
 */
export function astToPython(ast) {
  const ctx = new PythonCodegenContext();
  const json = ast.toJSON();
  const { config, data = {}, params = {}, plotDefaults, ...view } = json;
  delete view.meta;

  // Pre-compute data variable names - suffix with _data when a param has the same name
  const paramNameSet = new Set(Object.keys(params));
  for (const name of Object.keys(data)) {
    let safe = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    if (PYTHON_KEYWORDS.has(safe)) safe += '_';
    ctx.dataVarMap.set(name, paramNameSet.has(name) ? safe + '_data' : safe);
  }

  if (Object.values(params).some(dateParamParts)) {
    ctx.emit('from datetime import date');
    ctx.blank();
  }
  ctx.emit('import vgplot as vg');
  ctx.blank();

  // data - emit one variable per named dataset
  const dataEntries = Object.entries(data);
  for (const [name, def] of dataEntries) {
    ctx.emit(`${ctx.dataVar(name)} = ${emitDataDef(def, ctx)}`);
  }
  if (dataEntries.length) ctx.blank();

  // params - emitted before view so variables are in scope
  const paramEntries = Object.entries(params);
  for (const [name, def] of paramEntries) {
    ctx.emit(emitParamDef(ctx.ident(name), def, ctx));
  }
  if (paramEntries.length) ctx.blank();

  // view / layout / plot — pass plotDefaults, renamed data, and config as kwargs on the outermost call
  const topKwargs = [];
  // Only pass data= for entries whose Python variable was renamed to avoid a param name clash.
  const renamedData = dataEntries.filter(([name]) => ctx.dataVar(name) !== ctx.ident(name));
  if (renamedData.length) {
    const dataKwargs = renamedData.map(([name]) => `${JSON.stringify(name)}: ${ctx.dataVar(name)}`);
    topKwargs.push(`data={${dataKwargs.join(', ')}}`);
  }
  if (plotDefaults) topKwargs.push(`plot_defaults=${literal(plotDefaults)}`);
  if (config) topKwargs.push(`config=${literal(config)}`);
  ctx.emit(`view = ${emitComponent(view, ctx, topKwargs)}`);

  return ctx.toString();
}

/** Year/month/day parts of a date-valued param def ({date: 'YYYY-MM-DD'}), or null. */
function dateParamParts(def) {
  if (def && typeof def === 'object' && !Array.isArray(def) &&
      Object.keys(def).length === 1 && typeof def.date === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(def.date);
    if (m) return m.slice(1).map(Number);
  }
  return null;
}

function emitParamDef(name, def, ctx) {
  if (def === null || def === undefined) return `${name} = vg.param(None)`;
  if (typeof def !== 'object') return `${name} = vg.param(${literal(def, 0, ctx)})`;
  if (Array.isArray(def)) {
    return `${name} = vg.param([${def.map(v => literal(v, 0, ctx)).join(', ')}])`;
  }
  const parts = dateParamParts(def);
  if (parts) return `${name} = vg.param(date(${parts.join(', ')}))`;
  const { select, ...opts } = def;
  if (select) {
    const optArgs = buildArgs(opts, ctx);
    return `${name} = vg.selection.${camelCaseToSnake(select)}(${optArgs.join(', ')})`;
  }
  return `${name} = vg.param(${literal(def, 0, ctx)})`;
}

/** @param {PythonCodegenContext} ctx @param {string[]} topKwargs */
function emitComponent(node, ctx, topKwargs = []) {
  if (!node || typeof node !== 'object') return literal(node);
  if (Array.isArray(node)) {
    const body = node.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return node.length ? '[\n' + body + ',\n]' : '[]';
  }
  const kwargSuffix = topKwargs.length
    ? ',\n' + topKwargs.map(k => indentLine(k, 1)).join(',\n')
    : '';
  if (node.vconcat) {
    const body = node.vconcat.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return `vg.vconcat(\n${body}${kwargSuffix},\n)`;
  }
  if (node.hconcat) {
    const body = node.hconcat.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return `vg.hconcat(\n${body}${kwargSuffix},\n)`;
  }
  if (node.vspace !== undefined) return `vg.vspace(${literal(node.vspace, 0, ctx)})`;
  if (node.hspace !== undefined) return `vg.hspace(${literal(node.hspace, 0, ctx)})`;
  if (node.input) return emitInput(node, ctx);
  if (node.legend) return emitLegend(node, ctx);
  if (node.plot) return emitPlotObject(node, ctx, topKwargs);
  return literal(node, 0, ctx);
}

/** @param {PythonCodegenContext} ctx */
function emitInteractor(node, ctx) {
  const { select, ...opts } = node;
  const args = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      const pyKey = INTERACTOR_KEY_MAP[k] || camelCaseToSnake(k);
      if (k === 'brush' && v && typeof v === 'object' && !Array.isArray(v)) {
        return kwarg(pyKey, `vg.brush(${buildArgs(v, ctx).join(', ')})`);
      }
      return kwarg(pyKey, literal(v, 0, ctx));
    });
  return `vg.${camelCaseToSnake(select)}(${args.join(', ')})`;
}

/** @param {PythonCodegenContext} ctx */
function emitLegend(node, ctx) {
  const { legend, ...opts } = node;
  const args = buildArgs(opts, ctx, LEGEND_KEY_MAP);
  return `vg.${camelCaseToSnake(legend)}_legend(${args.join(', ')})`;
}

/** @param {PythonCodegenContext} ctx @param {string[]} topKwargs */
function emitPlotObject(view, ctx, topKwargs = []) {
  const items = [];
  for (const mark of view.plot || []) {
    if (mark.mark) items.push(emitMark(mark, ctx));
    else if (mark.select) items.push(emitInteractor(mark, ctx));
    else if (mark.legend) items.push(emitLegend(mark, ctx));
    else items.push(literal(mark, 0, ctx));
  }
  for (const [k, v] of Object.entries(view)) {
    if (k === 'plot' || v === undefined) continue;
    items.push(emitDirective(k, v, ctx));
  }
  items.push(...topKwargs);
  const body = items.map(s => indentLine(s, 1)).join(',\n');
  return items.length ? `vg.plot(\n${body},\n)` : 'vg.plot()';
}

function emitDataDef(def, ctx) {
  const { type, file, query, ...rest } = def;
  if ((type === 'parquet' || (!type && file && file.endsWith('.parquet'))) && file) {
    const extra = buildArgs(rest, ctx).join(', ');
    return extra ? `vg.parquet(${literal(file, 0, ctx)}, ${extra})` : `vg.parquet(${literal(file, 0, ctx)})`;
  }
  if ((type === 'csv' || (!type && file && file.endsWith('.csv'))) && file) {
    const extra = buildArgs(rest, ctx).join(', ');
    return extra ? `vg.csv(${literal(file, 0, ctx)}, ${extra})` : `vg.csv(${literal(file, 0, ctx)})`;
  }
  if (type === 'spatial' && file) {
    const args = [literal(file, 0, ctx)];
    if (rest.layer !== undefined) args.push(`layer=${literal(rest.layer, 0, ctx)}`);
    for (const [k, v] of Object.entries(rest)) {
      if (k !== 'layer') args.push(kwarg(camelCaseToSnake(k), literal(v, 0, ctx)));
    }
    return `vg.spatial(${args.join(', ')})`;
  }
  if (type === 'table' && query && !Object.keys(rest).length) return `vg.table(${literal(query, 0, ctx)})`;
  if (type === 'json') {
    const { data: inlineData, ...more } = rest;
    const args = [];
    if (inlineData !== undefined) args.push(literal(inlineData, 0, ctx));
    if (file) args.push(`file=${literal(file, 0, ctx)}`);
    args.push(...buildArgs(more, ctx));
    return `vg.json(${args.join(', ')})`;
  }
  return literal(def, 0, ctx);
}

// Keep in sync with the JS/Python API surface — new encodings need entries here.
const ENCODING_SIMPLE = new Set([
  'count', 'min', 'max', 'median',
  'dateMonth', 'dateMonthDay', 'centroidX', 'centroidY',
]);
const ENCODING_WITH_OPTS = new Set(['avg', 'sum', 'bin']);

/**
 * @param {any} v
 * @param {PythonCodegenContext} ctx
 */
function emitEncoding(v, ctx) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return literal(v, 0, ctx);
  const keys = Object.keys(v);
  if (!keys.length) return literal(v, 0, ctx);
  const key = keys[0];
  if (key === 'sql' && keys.length === 1) return `vg.sql(${literal(v.sql, 0, ctx)})`;
  if ((key === 'argmax' || key === 'argmin') && Array.isArray(v[key])) {
    return `vg.${key}(${v[key].map(x => literal(x, 0, ctx)).join(', ')})`;
  }
  if (ENCODING_WITH_OPTS.has(key)) {
    const { [key]: col, ...opts } = v;
    const args = [literal(col, 0, ctx),
      ...Object.entries(opts)
        .filter(([, val]) => val !== null && val !== undefined)
        .map(([k, val]) => kwarg(camelCaseToSnake(k), literal(val, 0, ctx)))];
    return `vg.${key}(${args.join(', ')})`;
  }
  if (keys.length === 1 && ENCODING_SIMPLE.has(key)) {
    const val = v[key];
    const fn = camelCaseToSnake(key);
    return (val === '' || val == null) ? `vg.${fn}()` : `vg.${fn}(${literal(val, 0, ctx)})`;
  }
  if (key === 'column' && keys.length === 1) return `vg.column(${literal(v.column, 0, ctx)})`;
  if (key === 'geojson' && keys.length === 1) return `vg.geojson(${literal(v.geojson, 0, ctx)})`;
  return literal(v, 0, ctx);
}

/** @param {PythonCodegenContext} ctx */
function emitMark(mark, ctx) {
  const { mark: name, data, ...enc } = mark;
  const args = [];
  if (data !== undefined) {
    if (data && typeof data === 'object' && data.from &&
        typeof data.from === 'string' && !data.from.startsWith('$') &&
        Object.keys(data).length === 1) {
      // Simple dataset name -> positional variable reference
      args.push(ctx.dataVar(data.from));
    } else {
      let dataRef = data;
      const dataOpts = [];
      if (data && typeof data === 'object' && data.from) {
        const { from: fromVal, ...rest } = data;
        dataRef = { from: fromVal };
        for (const [k, v] of Object.entries(rest)) {
          dataOpts.push(kwarg(camelCaseToSnake(k), literal(v, 0, ctx)));
        }
      }
      args.push(`data=${emitDataRef(dataRef, ctx)}`);
      args.push(...dataOpts);
    }
  }
  for (const [k, v] of Object.entries(enc)) {
    if (v === undefined) continue;
    if (k === 'sort' && v && typeof v === 'object' && !Array.isArray(v)) {
      args.push(`sort=vg.sort(${buildArgs(v, ctx).join(', ')})`);
    } else if (k === 'channels' && v && typeof v === 'object' && !Array.isArray(v)) {
      const chanArgs = Object.entries(v)
        .map(([ck, cv]) => kwarg(ck, literal(cv, 0, ctx))).join(', ');
      args.push(`channels=vg.channels(${chanArgs})`);
    } else {
      args.push(kwarg(camelCaseToSnake(k), emitEncoding(v, ctx)));
    }
  }
  const snakeName = camelCaseToSnake(name);
  const argStr = args.join(', ');
  return argStr.length ? `vg.${snakeName}(${argStr})` : `vg.${snakeName}()`;
}

/** @param {PythonCodegenContext} ctx */
function emitDirective(key, value, ctx) {
  if (key === 'margins' && value && typeof value === 'object') {
    return `vg.margins(${buildArgs(value, ctx).join(', ')})`;
  }
  return `vg.${camelCaseToSnake(key)}(${literal(value, 0, ctx)})`;
}

/** @param {PythonCodegenContext} ctx */
function emitInput(node, ctx) {
  const kind = node.input;
  const opts = { ...node };
  delete opts.input;
  const args = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => kwarg(inputArgName(k), emitInputValue(k, v, ctx)));
  const rename = { table: 'table_input' };
  const fn = rename[kind] ?? kind;
  // Keep in sync with the Python vgplot input helpers.
  const namedInputs = ['slider', 'select', 'checkbox', 'menu', 'search', 'table'];
  if (namedInputs.includes(kind)) return `vg.${fn}(${args.join(', ')})`;
  return `vg.input(${literal(kind, 0, ctx)}${args.length ? ', ' + args.join(', ') : ''})`;
}

/**
 * @param {string} key
 * @param {any} v
 * @param {PythonCodegenContext} ctx
 */
function emitInputValue(key, v, ctx) {
  if (key === 'options' && Array.isArray(v)) {
    const items = v.map(item => {
      if (item && typeof item === 'object' && 'label' in item && 'value' in item) {
        return item.label === item.value
          ? literal(item.label, 0, ctx)
          : `vg.option(${literal(item.label, 0, ctx)}, value=${literal(item.value, 0, ctx)})`;
      }
      return literal(item, 0, ctx);
    });
    return '[' + items.join(', ') + ']';
  }
  if (key === 'from' && typeof v === 'string' && ctx.dataVarMap.has(v)) {
    return ctx.dataVar(v);
  }
  return literal(v, 0, ctx);
}

function emitDataRef(data, ctx) {
  if (Array.isArray(data)) return literal(data, 0, ctx);
  if (data && typeof data === 'object' && data.from) {
    const { from: name, ...rest } = data;
    const nameRef = ctx.dataVarMap.has(name) ? ctx.dataVar(name) : literal(name, 0, ctx);
    if (!Object.keys(rest).length) return nameRef;
    const extraArgs = buildArgs(rest, ctx);
    return `vg.source(${[nameRef, ...extraArgs].join(', ')})`;
  }
  return literal(data, 0, ctx);
}

export class PythonCodegenContext {
  constructor() {
    this.lines = [];
    this.depth = 0;
    this.identMap = new Map();
    this.dataVarMap = new Map(); // originalDataName -> pythonVarName
    this.defaultAttrsVar = ''; // variable name for shared plot default attributes
  }
  emit(line) { this.lines.push(this.tab() + line); }
  blank() {
    if (this.lines.length === 0 || this.lines[this.lines.length - 1] !== '') {
      this.lines.push('');
    }
  }
  indent() { this.depth += 1; }
  dedent() { this.depth = Math.max(0, this.depth - 1); }
  tab() { return '    '.repeat(this.depth); }
  toString() { return this.lines.join('\n') + '\n'; }
  ident(name) {
    if (this.identMap.has(name)) return this.identMap.get(name);
    let safe = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    if (PYTHON_KEYWORDS.has(safe)) safe += '_';
    this.identMap.set(name, safe);
    return safe;
  }
  /** Python variable name for a data source (avoids clash with same-named params). */
  dataVar(name) {
    return this.dataVarMap.get(name) ?? this.ident(name);
  }
}
