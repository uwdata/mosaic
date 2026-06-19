import { camelCaseToSnake } from './util.js';

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'type', 'while', 'with', 'yield',
]);

// Keywords that cannot appear as a bare keyword-argument name. `type` is a
// builtin, not a reserved word, so it stays valid as a kwarg.
const PYTHON_KWARG_UNSAFE = new Set(
  [...PYTHON_KEYWORDS].filter(k => k !== 'type')
);

/** Format `name=value`, falling back to **{'name': value} for keyword names. */
function kwarg(name, valueStr) {
  return PYTHON_KWARG_UNSAFE.has(name)
    ? `**{${JSON.stringify(name)}: ${valueStr}}`
    : `${name}=${valueStr}`;
}

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
  const { meta, config, data = {}, params = {}, plotDefaults, ...view } = json;

  // Pre-compute data variable names - suffix with _data when a param has the same name
  const paramNameSet = new Set(Object.keys(params));
  for (const name of Object.keys(data)) {
    let safe = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    if (PYTHON_KEYWORDS.has(safe)) safe += '_';
    ctx.dataVarMap.set(name, paramNameSet.has(name) ? safe + '_data' : safe);
  }

  ctx.emit('import vgplot as vg');
  ctx.blank();

  // data - emit one variable per named dataset
  const dataEntries = Object.entries(data);
  for (const [name, def] of dataEntries) {
    ctx.emit(`${ctx.dataVar(name)} = ${emitDataDef(def)}`);
  }
  if (dataEntries.length) ctx.blank();

  // params - emitted before view so variables are in scope
  const paramEntries = Object.entries(params);
  for (const [name, def] of paramEntries) {
    ctx.emit(emitParamDef(ctx.ident(name), def));
  }
  if (paramEntries.length) ctx.blank();

  // view / layout / plot
  ctx.emit(`view = ${emitComponent(view, ctx)}`);
  ctx.blank();

  // spec call - pass all top-level fields explicitly so vg.spec() is self-contained
  const specArgs = ['view'];

  // Only pass data= for entries whose Python variable was renamed to avoid a param name clash.
  // All other data sources and params are discovered automatically via frame inspection in spec().
  const renamedData = dataEntries.filter(([name]) => ctx.dataVar(name) !== ctx.ident(name));
  if (renamedData.length) {
    const dataKwargs = renamedData.map(([name]) => `${JSON.stringify(name)}: ${ctx.dataVar(name)}`);
    specArgs.push(`data={${dataKwargs.join(', ')}}`);
  }

  if (plotDefaults) specArgs.push(`plot_defaults=${literal(plotDefaults)}`);
  if (config) specArgs.push(`config=${literal(config)}`);

  ctx.emit(`spec = vg.spec(${specArgs.join(', ')})`);

  return ctx.toString();
}

function emitParamDef(name, def, ctx) {
  if (def === null || def === undefined) return `${name} = vg.param(None)`;
  if (typeof def !== 'object') return `${name} = vg.param(${literal(def, 0, ctx)})`;
  if (Array.isArray(def)) {
    return `${name} = vg.param([${def.map(v => literal(v, 0, ctx)).join(', ')}])`;
  }
  const { select, ...opts } = def;
  if (select) {
    const optArgs = buildArgs(opts, ctx);
    return `${name} = vg.selection.${camelCaseToSnake(select)}(${optArgs.join(', ')})`;
  }
  return `${name} = vg.param(${literal(def, 0, ctx)})`;
}

/** @param {PythonCodegenContext} ctx */
function emitComponent(node, ctx) {
  if (!node || typeof node !== 'object') return literal(node);
  if (Array.isArray(node)) {
    const body = node.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return '[\n' + body + '\n]';
  }
  if (node.vconcat) {
    const body = node.vconcat.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return `vg.vconcat(\n${body}\n)`;
  }
  if (node.hconcat) {
    const body = node.hconcat.map(n => indentLine(emitComponent(n, ctx), 1)).join(',\n');
    return `vg.hconcat(\n${body}\n)`;
  }
  if (node.vspace !== undefined) return `vg.vspace(${literal(node.vspace, 0, ctx)})`;
  if (node.hspace !== undefined) return `vg.hspace(${literal(node.hspace, 0, ctx)})`;
  if (node.input) return emitInput(node, ctx);
  if (node.legend) return emitLegend(node, ctx);
  if (node.plot) return emitPlotObject(node, ctx);
  return literal(node, 0, ctx);
}

const INTERACTOR_KEY_MAP = { as: 'bind', pixelSize: 'pixel_size' };
const LEGEND_KEY_MAP = { as: 'bind', for: 'plot' };

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

/** @param {PythonCodegenContext} ctx */
function emitPlotObject(view, ctx) {
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
  const body = items.map(s => indentLine(s, 1)).join(',\n');
  return `vg.plot(\n${body}\n)`;
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

const ENCODING_SIMPLE = new Set([
  'count', 'min', 'max', 'median',
  'dateMonth', 'dateMonthDay', 'centroidX', 'centroidY',
]);
const ENCODING_WITH_OPTS = new Set(['avg', 'mean', 'sum', 'bin']);

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
  return literal(v, 0, ctx);
}

function inputArgName(key) {
  if (key === 'as') return 'bind';
  if (key === 'from') return 'source';
  return camelCaseToSnake(key);
}

function emitDataRef(data, ctx) {
  if (Array.isArray(data)) return literal(data, 0, ctx);
  if (data && typeof data === 'object' && data.from) {
    const { from: name, ...rest } = data;
    if (!Object.keys(rest).length) return literal(name, 0, ctx);
    const extraArgs = buildArgs(rest, ctx);
    return `vg.source(${[literal(name, 0, ctx), ...extraArgs].join(', ')})`;
  }
  return literal(data, 0, ctx);
}

function literal(v, depth = 0, ctx = null) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return "float('nan')";
    if (v === Infinity) return "float('inf')";
    if (v === -Infinity) return "float('-inf')";
    return String(v);
  }
  if (typeof v === 'string') {
    if (/^\$[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
      return ctx ? ctx.ident(v.slice(1)) : v.slice(1);
    }
    // Prefer single quotes when the string contains double quotes (avoids escape sequences)
    if (v.includes('"') && !v.includes("'")) return `'${v}'`;
    return JSON.stringify(v);
  }
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    // Treat all strings as primitive (including $param refs which resolve to short idents)
    const isPrimitive = x => x === null || typeof x === 'boolean' || typeof x === 'number' ||
      typeof x === 'string';
    if (v.length <= 6 && v.every(isPrimitive)) {
      return '[' + v.map(x => literal(x, 0, ctx)).join(', ') + ']';
    }
    const items = v.map(x => pad + literal(x, depth + 1, ctx)).join(',\n');
    return '[\n' + items + ',\n' + closePad + ']';
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v)
      .filter(([, val]) => val !== undefined)
      .map(([k, val]) => `${pad}${JSON.stringify(k)}: ${literal(val, depth + 1, ctx)}`);
    if (!entries.length) return '{}';
    return '{\n' + entries.join(',\n') + '\n' + closePad + '}';
  }
  return 'None';
}


function indentLine(str, depth) {
  const pad = '    '.repeat(depth);
  return str.split('\n').map(line => pad + line).join('\n');
}

export class PythonCodegenContext {
  constructor() {
    this.lines = [];
    this.depth = 0;
    this.identMap = new Map();
    this.dataVarMap = new Map(); // originalDataName -> pythonVarName
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
