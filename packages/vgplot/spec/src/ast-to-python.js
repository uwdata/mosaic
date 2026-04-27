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
    const keys = Object.keys(meta);
    const simple = ['title', 'description', 'credit'];
    const onlySimple = keys.every(k => simple.includes(k));
    if (onlySimple) {
      ctx.emit(
        `_meta = vg.meta(${joinArgs({ title: meta.title, description: meta.description, credit: meta.credit })})`
      );
    } else {
      ctx.emit(`_meta = ${literal(meta)}`);
    }
  }

  // data
  if (Object.keys(data).length) {
    const entries = Object.entries(data).map(
      ([name, def]) => `${ctx.ident(name)}=${emitDataDef(def)}`
    );
    ctx.emit('_data = vg.data(');
    ctx.indent();
    entries.forEach((entry, i) => {
      const suffix = i < entries.length - 1 ? ',' : '';
      ctx.emit(`${entry}${suffix}`);
    });
    ctx.dedent();
    ctx.emit(')');
  } else {
    ctx.emit('_data = {}');
  }
  ctx.blank();

  // params - emitted before view so variables are in scope
  const paramEntries = Object.entries(params);
  if (paramEntries.length) {
    for (const [name, def] of paramEntries) {
      ctx.emit(emitParamDef(ctx.ident(name), def));
    }
    ctx.blank();
  }

  // view / layout / plot
  ctx.emit(`_view = ${emitComponent(view, ctx)}`);
  ctx.blank();

  const positional = [];
  const kwargs = [];
  if (meta) positional.push('_meta');
  if (Object.keys(data).length) positional.push('_data');
  positional.push('_view');
  if (paramEntries.length) {
    const dictItems = paramEntries.map(([name]) => `"${name}": ${ctx.ident(name)}`);
    kwargs.push(`params={${dictItems.join(', ')}}`);
  }
  if (plotDefaults) kwargs.push(`plotDefaults=${literal(plotDefaults)}`);
  if (config) kwargs.push(`config=${literal(config)}`);
  ctx.emit(`spec = vg.spec(${[...positional, ...kwargs].join(', ')})`);

  return ctx.toString();
}

function emitParamDef(name, def) {
  if (def === null || def === undefined) return `${name} = vg.Param.value(None)`;
  if (typeof def !== 'object') return `${name} = vg.Param.value(${literal(def)})`;
  if (Array.isArray(def)) {
    return `${name} = vg.Param.array([${def.map(v => literal(v)).join(', ')}])`;
  }
  const { select, ...opts } = def;
  if (select) {
    const optArgs = Object.entries(opts)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`);
    return `${name} = vg.Selection.${camelCaseToSnake(select)}(${optArgs.join(', ')})`;
  }
  return `${name} = vg.Param.value(${literal(def)})`;
}

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
  if (node.input) {
    return emitInput(node, ctx);
  }
  if (node.plot) {
    return emitPlotObject(node, ctx);
  }
  return literal(node, 0, ctx);
}

/** @param {PythonCodegenContext} ctx */
function emitPlotObject(view, ctx) {
  const items = [];
  for (const mark of view.plot || []) {
    if (!mark.mark) {
      items.push(literal(mark, 0, ctx));
    } else {
      items.push(emitMark(mark, ctx));
    }
  }
  for (const [k, v] of Object.entries(view)) {
    if (k === 'plot') continue;
    if (v === undefined) continue;
    items.push(emitDirective(k, v, ctx));
  }
  const body = items.map(s => indentLine(s, 1)).join(',\n');
  return `vg.plot(\n${body}\n)`;
}

function emitDataDef(def) {
  const { type, file, query } = def;
  const keys = Object.keys(def);
  if (type === 'parquet' && file && keys.length === 2) return `vg.parquet(${literal(file)})`;
  if (type === 'table' && query && keys.length === 2) return `vg.table(${literal(query)})`;
  return literal(def);
}

/** @param {PythonCodegenContext} ctx */
function emitMark(mark, ctx) {
  const { mark: name, data, ...enc } = mark;
  const fn = markMap[name];
  const args = [];
  if (data !== undefined) args.push(`data=${emitDataRef(data, ctx)}`);
  for (const [k, v] of Object.entries(enc)) {
    if (v === undefined) continue;
    const arg = argName(k);
    args.push(`${arg}=${literal(v, 0, ctx)}`);
  }
  if (fn) {
    return `vg.${fn}(${args.join(', ')})`;
  }
  // Fallback: use snake_case name directly (caught by __getattr__ on the Python side)
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
  const mapped = directiveMap[key];
  if (mapped) return `vg.${mapped}(${literal(value, 0, ctx)})`;
  // Fallback: use snake_case key directly (caught by __getattr__ on the Python side)
  return `vg.${camelCaseToSnake(key)}(${literal(value, 0, ctx)})`;
}

/** @param {PythonCodegenContext} ctx */
function emitInput(node, ctx) {
  const kind = node.input;
  const opts = { ...node };
  delete opts.input;
  const args = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${inputArgName(k)}=${literal(v, 0, ctx)}`);
  if (kind === 'slider') return `vg.slider(${args.join(', ')})`;
  if (kind === 'select') return `vg.select(${args.join(', ')})`;
  if (kind === 'checkbox') return `vg.checkbox(${args.join(', ')})`;
  return `vg.input(${literal(kind, 0, ctx)}${args.length ? ', ' + args.join(', ') : ''})`;
}

function inputArgName(key) {
  if (key === 'as') return 'as_';
  if (key === 'from') return 'from_';
  return camelCaseToSnake(key);
}

function argName(key) {
  if (key === 'as') return 'as_';
  if (key === 'from') return 'from_';
  return camelCaseToSnake(key);
}

function emitDataRef(data, ctx) {
  if (Array.isArray(data)) return literal(data, 0, ctx);
  if (data && typeof data === 'object' && data.from) {
    const keys = Object.keys(data);
    if (keys.length === 1) return `vg.from_(${literal(data.from, 0, ctx)})`;
    return literal(data, 0, ctx);
  }
  return literal(data, 0, ctx);
}

function literal(v, depth = 0, ctx = null) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    // param reference like "$brush" → emit as the (possibly renamed) variable
    if (/^\$[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
      return ctx ? ctx.ident(v.slice(1)) : v.slice(1);
    }
    return JSON.stringify(v);
  }
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
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
  emit(line) {
    this.lines.push(this.tab() + line);
  }
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

const markMap = {
  // Existing
  ruleY: 'rule_y',
  ruleX: 'rule_x',
  lineY: 'line_y',
  lineX: 'line_x',
  barY: 'bar_y',
  barX: 'bar_x',
  areaY: 'area_y',
  areaX: 'area_x',
  dot: 'dot',
  text: 'text',
  density: 'density',
  // added more
  frame: 'frame',
  rectY: 'rect_y',
  rectX: 'rect_x',
  rect: 'rect',
  geo: 'geo',
  raster: 'raster',
  contour: 'contour',
  heatmap: 'heatmap',
  hexbin: 'hexbin',
  hexgrid: 'hexgrid',
  regressionY: 'regression_y',
  denseLine: 'dense_line',
  densityY: 'density_y',
  densityX: 'density_x',
  sphere: 'sphere',
  voronoi: 'voronoi',
  hull: 'hull',
  delaunayMesh: 'delaunay_mesh',
  line: 'line',
  image: 'image',
  arrow: 'arrow',
  vector: 'vector',
  tickX: 'tick_x',
  tickY: 'tick_y',
  textX: 'text_x',
  waffleY: 'waffle_y',
  axisX: 'axis_x',
  axisY: 'axis_y',
  axisFy: 'axis_fy',
  gridX: 'grid_x',
  gridY: 'grid_y',
  errorbarX: 'errorbar_x',
};

const directiveMap = {
  // Existing
  yGrid: 'y_grid',
  xGrid: 'x_grid',
  yLabel: 'y_label',
  xLabel: 'x_label',
  yTickFormat: 'y_tick_format',
  xTickFormat: 'x_tick_format',
  xAxis: 'x_axis',
  yAxis: 'y_axis',
  xLabelAnchor: 'x_label_anchor',
  yLabelAnchor: 'y_label_anchor',
  rRange: 'r_range',
  colorDomain: 'color_domain',
  colorScale: 'color_scale',
  xTickSize: 'x_tick_size',
  yTickSize: 'y_tick_size',
  width: 'width',
  height: 'height',
  margins: 'margins',
  //added more
  colorScheme: 'color_scheme',
  colorRange: 'color_range',
  xDomain: 'x_domain',
  yDomain: 'y_domain',
  xReverse: 'x_reverse',
  yReverse: 'y_reverse',
  xZero: 'x_zero',
  yZero: 'y_zero',
  xNice: 'x_nice',
  yNice: 'y_nice',
  xClamp: 'x_clamp',
  yClamp: 'y_clamp',
  marginLeft: 'margin_left',
  marginRight: 'margin_right',
  marginTop: 'margin_top',
  marginBottom: 'margin_bottom',
  inset: 'inset',
  opacityDomain: 'opacity_domain',
  opacityScale: 'opacity_scale',
  opacityRange: 'opacity_range',
  rDomain: 'r_domain',
  colorLabel: 'color_label',
  xTickRotate: 'x_tick_rotate',
  yTickRotate: 'y_tick_rotate',
  facetGrid: 'facet_grid',
  xyDomain: 'xy_domain',
};
