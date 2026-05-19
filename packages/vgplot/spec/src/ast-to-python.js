import { camelCaseToSnake } from './util.js';

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'type', 'while', 'with', 'yield',
]);

/**
 * Generate Python code for a Mosaic spec AST using the vgplot Python DSL.
 * Preamble:  import vgplot as vg
 * Final var: spec
 */
export function astToPython(ast) {
  const ctx = new PythonCodegenContext();
  const json = ast.toJSON();
  const { meta, config, data = {}, params = {}, plotDefaults, ...view } = json;

  ctx.emit('import vgplot as vg');
  ctx.blank();

  if (meta) {
    ctx.emit(`meta = vg.meta(${joinArgs(meta)})`);
  }

  // data
  if (Object.keys(data).length) {
    for (const [name, def] of Object.entries(data)) {
      ctx.emit(`${ctx.ident(name)} = ${emitDataDef(def)}`);
    }
    ctx.blank();
  }

  // params - emitted before view so variables are in scope
  const paramEntries = Object.entries(params);
  if (paramEntries.length) {
    for (const [name, def] of paramEntries) {
      ctx.emit(emitParamDef(ctx.ident(name), def));
    }
    ctx.blank();
  }

  // view / layout / plot
  ctx.emit(`view = ${emitComponent(view, ctx)}`);
  ctx.blank();

  const kwargs = [];
  if (plotDefaults) kwargs.push(`plotDefaults=${literal(plotDefaults)}`);
  if (config) kwargs.push(`config=${literal(config)}`);
  ctx.emit(`spec = vg.spec(${kwargs.join(', ')})`);

  return ctx.toString();
}

function emitParamDef(name, def) {
  if (def === null || def === undefined) return `${name} = vg.param(None)`;
  if (typeof def !== 'object') return `${name} = vg.param(${literal(def)})`;
  if (Array.isArray(def)) {
    return `${name} = vg.param([${def.map(v => literal(v)).join(', ')}])`;
  }
  const { select, ...opts } = def;
  if (select) {
    const optArgs = Object.entries(opts)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`);
    return `${name} = vg.selection.${camelCaseToSnake(select)}(${optArgs.join(', ')})`;
  }
  return `${name} = vg.param(${literal(def)})`;
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
        const brushArgs = Object.entries(v)
          .map(([bk, bv]) => `${camelCaseToSnake(bk)}=${literal(bv, 0, ctx)}`).join(', ');
        return `${pyKey}=vg.brush(${brushArgs})`;
      }
      return `${pyKey}=${literal(v, 0, ctx)}`;
    });
  return `vg.${camelCaseToSnake(select)}(${args.join(', ')})`;
}

/** @param {PythonCodegenContext} ctx */
function emitLegend(node, ctx) {
  const { legend, ...opts } = node;
  const args = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${LEGEND_KEY_MAP[k] || camelCaseToSnake(k)}=${literal(v, 0, ctx)}`);
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

function emitDataDef(def) {
  const { type, file, query, ...rest } = def;
  if ((type === 'parquet' || (!type && file && file.endsWith('.parquet'))) && file) {
    const extra = Object.entries(rest)
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`).join(', ');
    return extra ? `vg.parquet(${literal(file)}, ${extra})` : `vg.parquet(${literal(file)})`;
  }
  if ((type === 'csv' || (!type && file && file.endsWith('.csv'))) && file) {
    const extra = Object.entries(rest)
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`).join(', ');
    return extra ? `vg.csv(${literal(file)}, ${extra})` : `vg.csv(${literal(file)})`;
  }
  if (type === 'spatial' && file) {
    const args = [literal(file)];
    if (rest.layer !== undefined) args.push(`layer=${literal(rest.layer)}`);
    const extra = Object.entries(rest)
      .filter(([k]) => k !== 'layer')
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`);
    return `vg.spatial(${[...args, ...extra].join(', ')})`;
  }
  if (type === 'table' && query && !Object.keys(rest).length) return `vg.table(${literal(query)})`;
  return literal(def);
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
        .map(([k, val]) => `${camelCaseToSnake(k)}=${literal(val, 0, ctx)}`)];
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
      // Simple dataset name → positional variable reference
      args.push(ctx.ident(data.from));
    } else {
      let dataRef = data;
      const dataOpts = [];
      if (data && typeof data === 'object' && data.from) {
        const { from: fromVal, ...rest } = data;
        dataRef = { from: fromVal };
        for (const [k, v] of Object.entries(rest)) {
          dataOpts.push(`${camelCaseToSnake(k)}=${literal(v, 0, ctx)}`);
        }
      }
      args.push(`data=${emitDataRef(dataRef, ctx)}`);
      args.push(...dataOpts);
    }
  }
  for (const [k, v] of Object.entries(enc)) {
    if (v === undefined) continue;
    if (k === 'sort' && v && typeof v === 'object' && !Array.isArray(v)) {
      const sortArgs = Object.entries(v)
        .map(([sk, sv]) => `${camelCaseToSnake(sk)}=${literal(sv, 0, ctx)}`).join(', ');
      args.push(`sort=vg.sort(${sortArgs})`);
    } else if (k === 'channels' && v && typeof v === 'object' && !Array.isArray(v)) {
      const chanArgs = Object.entries(v)
        .map(([ck, cv]) => `${ck}=${literal(cv, 0, ctx)}`).join(', ');
      args.push(`channels=vg.channels(${chanArgs})`);
    } else {
      args.push(`${camelCaseToSnake(k)}=${emitEncoding(v, ctx)}`);
    }
  }
  const snakeName = camelCaseToSnake(name);
  const argStr = args.join(', ');
  return argStr.length ? `vg.${snakeName}(${argStr})` : `vg.${snakeName}()`;
}

/** @param {PythonCodegenContext} ctx */
function emitDirective(key, value, ctx) {
  if (key === 'margins' && value && typeof value === 'object') {
    const parts = Object.entries(value).map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v, 0, ctx)}`);
    return `vg.margins(${parts.join(', ')})`;
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
    .map(([k, v]) => `${inputArgName(k)}=${emitInputValue(k, v, ctx)}`);
  if (kind === 'slider') return `vg.slider(${args.join(', ')})`;
  if (kind === 'select') return `vg.select(${args.join(', ')})`;
  if (kind === 'checkbox') return `vg.checkbox(${args.join(', ')})`;
  if (kind === 'menu') return `vg.menu(${args.join(', ')})`;
  if (kind === 'search') return `vg.search(${args.join(', ')})`;
  if (kind === 'table') return `vg.table_input(${args.join(', ')})`;
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
    const extraArgs = Object.entries(rest)
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v, 0, ctx)}`);
    return `vg.source(${[literal(name, 0, ctx), ...extraArgs].join(', ')})`;
  }
  return literal(data, 0, ctx);
}

function literal(v, depth = 0, ctx = null) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (/^\$[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
      return ctx ? ctx.ident(v.slice(1)) : v.slice(1);
    }
    return JSON.stringify(v);
  }
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const isPrimitive = x => x === null || typeof x === 'boolean' || typeof x === 'number' ||
      (typeof x === 'string' && !/^\$/.test(x));
    if (v.length <= 6 && v.every(isPrimitive)) {
      return '[' + v.map(x => literal(x, 0, ctx)).join(', ') + ']';
    }
    const items = v.map(x => pad + literal(x, depth + 1, ctx)).join(',\n');
    return '[\n' + items + '\n' + closePad + ']';
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

function joinArgs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${literal(v)}`)
    .join(', ');
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
  toString() { return this.lines.join('\n'); }
  ident(name) {
    if (this.identMap.has(name)) return this.identMap.get(name);
    let safe = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    if (PYTHON_KEYWORDS.has(safe)) safe += '_';
    this.identMap.set(name, safe);
    return safe;
  }
}
