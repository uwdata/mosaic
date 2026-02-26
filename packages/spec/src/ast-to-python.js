import { camelCaseToSnake } from './util.js';

/**
 * Generate Python code for a Mosaic spec AST using the vgplot Python DSL.
 * Preamble:  import json; import mosaic.vgplot as vg
 * Final var: spec
 */
export function astToPython(ast) {
  const ctx = new PyGen();
  const json = ast.toJSON();
  const { meta, config, data = {}, params = {}, plotDefaults, ...view } = json;

  ctx.emit('import json');
  ctx.emit('import mosaic.vgplot as vg');
  ctx.blank();

  if (meta) {
    const keys = Object.keys(meta);
    const simple = ['title', 'description', 'credit'];
    const onlySimple = keys.every(k => simple.includes(k));
    if (onlySimple) {
      ctx.emit(
        `meta = vg.meta(${joinArgs({ title: meta.title, description: meta.description, credit: meta.credit })})`
      );
    } else {
      ctx.emit(`meta = ${literal(meta)}`);
    }
  }

  // data
  if (Object.keys(data).length) {
    const entries = Object.entries(data).map(
      ([name, def]) => `${ctx.ident(name)}=${emitDataDef(def)}`
    );
    ctx.emit('data = vg.data(');
    ctx.indent();
    ctx.emit(entries.join(',\n'));
    ctx.dedent();
    ctx.emit(')');
  } else {
    ctx.emit('data = {}');
  }
  ctx.blank();

  // view / layout / plot
  ctx.emit(`view = ${emitComponent(view, ctx, 0)}`);
  ctx.blank();

  const specArgs = [];
  if (meta) specArgs.push('meta=meta');
  if (Object.keys(data).length) specArgs.push('data=data');
  if (Object.keys(params).length) specArgs.push(`params=${literal(params)}`);
  if (plotDefaults) specArgs.push(`plotDefaults=${literal(plotDefaults)}`);
  if (config) specArgs.push(`config=${literal(config)}`);
  specArgs.push('view=view');
  ctx.emit(`spec = vg.spec(${specArgs.join(', ')})`);
  ctx.blank();
  ctx.emit('if __name__ == "__main__":');
  ctx.indent();
  ctx.emit('print(json.dumps(spec.to_dict(), sort_keys=True))');
  ctx.dedent();

  return ctx.toString();
}

function emitComponent(node, ctx, depth = 0) {
  if (!node || typeof node !== 'object') return literal(node);
  if (Array.isArray(node)) {
    const body = node.map(n => indentLine(emitComponent(n, ctx, depth + 1), depth + 1)).join(',\n');
    return '[\n' + body + '\n' + '    '.repeat(depth) + ']';
  }

  if (node.vconcat) {
    const body = node.vconcat.map(n => indentLine(emitComponent(n, ctx, depth + 1), depth + 1)).join(',\n');
  return `vg.vconcat(\n${body}\n${'    '.repeat(depth)})`;
  }
  if (node.hconcat) {
    const body = node.hconcat.map(n => indentLine(emitComponent(n, ctx, depth + 1), depth + 1)).join(',\n');
    return `vg.hconcat(\n${body}\n${'    '.repeat(depth)})`;
  }
  if (node.input) {
    return emitInput(node);
  }
  if (node.plot) {
    return emitPlotObject(node, depth);
  }
  return literal(node);
}

function emitPlotObject(view, depth) {
  const items = [];
  for (const mark of view.plot || []) {
    if (!mark.mark) {
      items.push(literal(mark));
    } else {
      items.push(emitMark(mark));
    }
  }
  for (const [k, v] of Object.entries(view)) {
    if (k === 'plot') continue;
    items.push(emitDirective(k, v));
  }
  const body = items.map(s => indentLine(s, depth + 1)).join(',\n');
  return `vg.plot(\n${body}\n${'    '.repeat(depth)})`;
}

function emitDataDef(def) {
  const { type, file, query } = def;
  const keys = Object.keys(def);
  if (type === 'parquet' && file && keys.length === 2) return `vg.parquet(${literal(file)})`;
  if (type === 'table' && query && keys.length === 2) return `vg.table(${literal(query)})`;
  return literal(def);
}

function emitMark(mark) {
  const { mark: name, data, ...enc } = mark;
  const fn = markMap[name];
  const args = [];
  if (data !== undefined) args.push(`data=${emitDataRef(data)}`);
  for (const [k, v] of Object.entries(enc)) {
    const arg = argName(k);
    args.push(`${arg}=${literal(v)}`);
  }
  if (fn) {
    return `vg.${fn}(${args.join(', ')})`;
  }
  const argStr = args.join(', ');
  return argStr.length ? `vg.mark(${literal(name)}, ${argStr})` : `vg.mark(${literal(name)})`;
}

function emitDirective(key, value) {
  if (key === 'margins' && value && typeof value === 'object') {
    const parts = Object.entries(value).map(([k, v]) => `${camelCaseToSnake(k)}=${literal(v)}`);
    return `vg.margins(${parts.join(', ')})`;
  }
  const mapped = directiveMap[key];
  if (mapped) return `vg.${mapped}(${literal(value)})`;
  return `vg.directive(${literal(key)}, ${literal(value)})`;
}

function emitInput(node) {
  const kind = node.input;
  const opts = { ...node };
  delete opts.input;
  const args = Object.entries(opts).map(([k, v]) => `${inputArgName(k)}=${literal(v)}`);
  if (kind === 'slider') return `vg.slider(${args.join(', ')})`;
  if (kind === 'select') return `vg.select(${args.join(', ')})`;
  if (kind === 'checkbox') return `vg.checkbox(${args.join(', ')})`;
  return `vg.input(${literal(kind)}${args.length ? ', ' + args.join(', ') : ''})`;
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

function emitDataRef(data) {
  if (Array.isArray(data)) return literal(data);
  if (data && typeof data === 'object' && data.from) {
    const keys = Object.keys(data);
    if (keys.length === 1) return `vg.from_(${literal(data.from)})`;
    return literal(data);
  }
  return literal(data);
}

function literal(v) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const items = v.map(x => '    ' + literal(x)).join(',\n');
    return '[\n' + items + '\n]';
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v).map(
      ([k, val]) => `    ${JSON.stringify(k)}: ${literal(val)}`
    );
    if (!entries.length) return '{}';
    return '{\n' + entries.join(',\n') + '\n}';
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
  return '    '.repeat(depth) + str;
}

class PyGen {
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
    const safe = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    this.identMap.set(name, safe);
    return safe;
  }
}

const markMap = {
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
  density: 'density'
};

const directiveMap = {
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
  margins: 'margins'
};
