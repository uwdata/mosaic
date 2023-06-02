import { create } from '@uwdata/mosaic-sql';
import { parseData } from './parse-data.js';
import { ParseContext } from './parse-spec.js';
import {
  error, paramRef, toArray,
  isArray, isNumberOrString, isObject, isString, isFunction
} from './util.js';

const TOPOJSON = 'https://cdn.jsdelivr.net/npm/topojson@3.0.2/+esm';

const SpecParsers = new Map([
  ['plot', { type: isArray, parse: parsePlot }],
  ['mark', { type: isString, parse: parseNakedMark }],
  ['legend', { type: isString, parse: parseLegend }],
  ['hconcat', { type: isArray, parse: parseHConcat }],
  ['vconcat', { type: isArray, parse: parseVConcat }],
  ['hspace', { type: isNumberOrString, parse: parseHSpace }],
  ['vspace', { type: isNumberOrString, parse: parseVSpace }],
  ['input', { type: isString, parse: parseInput }]
]);

const DataFormats = new Map([
  ['csv', parseCSVData],
  ['json', parseJSONData],
  ['geojson', parseGeoJSONData],
  ['topojson', parseTopoJSONData],
  ['parquet', parseParquetData],
  ['table', parseTableData]
]);

export function specToModule(spec, options) {
  spec = isString(spec) ? JSON.parse(spec) : spec;
  return new CodegenContext(options).generate(spec);
}

function maybeNewline(entry) {
  return entry?.length ? [''] : [];
}

class CodegenContext extends ParseContext {
  constructor(options) {
    super({
      specParsers: SpecParsers,
      dataFormats: DataFormats,
      ...options
    });
    this.imports = options?.imports || new Map([
      ['@uwdata/vgplot', '* as vg']
    ]);
    this.depth = 0;
  }

  async generate(input) {
    // eslint-disable-next-line no-unused-vars
    const { meta, data = {}, plotDefaults = {}, params, ...spec } = input;

    // parse data definitions
    const dataCode = await Promise.all(
      Object.keys(data).flatMap(name => {
        const q = parseData(name, data[name], this);
        return !q ? []
          : q.data ? `const ${name} = ${q.data};`
          : `await vg.coordinator().exec(\n  ${q}\n);`;
      })
    );

    // parse default attributes
    const defaultList = Object.keys(plotDefaults)
      .map(key => parseAttribute(plotDefaults, key, this));
    let defaultCode = [];
    if (defaultList.length) {
      this.plotDefaults = 'defaultAttributes';
      defaultCode = [
        'const defaultAttributes = [',
        defaultList.map(d => '  ' + d).join(',\n'),
        '];'
      ];
    }

    // parse param/selection definitions
    for (const name in params) {
      this.params.set(`$${name}`, parseParam(params[name], this));
    }

    const specCode = [
      `export default ${parseSpec(spec, this)};`
    ];

    const paramCode = [];
    for (const [key, value] of this.params) {
      paramCode.push(`const ${key} = ${value};`);
    }

    const importsCode = [];
    for (const [pkg, methods] of this.imports) {
      importsCode.push(
        isString(methods)
          ? `import ${methods} from "${pkg}";`
          : `import { ${methods.join(', ')} } from "${pkg}";`
      );
    }

    return [
      ...importsCode,
      ...maybeNewline(importsCode),
      ...dataCode,
      ...maybeNewline(dataCode),
      ...paramCode,
      ...maybeNewline(paramCode),
      ...defaultCode,
      ...maybeNewline(defaultCode),
      ...specCode
    ].join('\n');
  }

  addImport(pkg, method) {
    if (!this.imports.has(pkg)) {
      this.imports.set(pkg, []);
    }
    this.imports.get(pkg).push(method);
  }

  setImports(pkg, all) {
    this.imports.set(pkg, all);
  }

  maybeParam(value, ctr = 'vg.Param.value()') {
    const { params } = this;
    const name = paramRef(value);
    if (name) {
      const $name = `$${name}`;
      if (!params.has($name)) {
        params.set($name, ctr);
      }
      return $name;
    }
    return JSON.stringify(value);
  }

  maybeSelection(value) {
    return this.maybeParam(value, 'vg.Selection.intersect()');
  }

  maybeTransform(value) {
    if (isObject(value)) {
      return value.expr
        ? parseExpression(value, this)
        : parseTransform(value, this);
    }
  }

  indent() {
    this.depth += 1;
  }

  undent() {
    this.depth -= 1;
  }

  tab() {
    return Array.from({ length: this.depth }, () => '  ').join('');
  }
}

function parseExpression(spec, ctx) {
  const { expr, label } = spec;
  const tokens = expr.split(/(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$\w+)/g);
  let str = '';

  for (let i = 0; i < tokens.length; ++i) {
    const tok = tokens[i];
    if (tok.startsWith('$')) {
      str += `\${${ctx.maybeParam(tok)}}`;
    } else {
      str += tok;
    }
  }

  return `vg.sql\`${str}\``
    + (label ? `.annotate({ label: ${JSON.stringify(label)} })` : '');
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

  const args = name === 'count' || name == null ? [] : toArray(spec[name]);
  let str = `vg.${name}(`
    + args.map(v => ctx.maybeParam(v)).join(', ')
    + ')';

  if (spec.distinct) {
    str += '.distinct()'
  }
  if (spec.order) {
    const p = toArray(spec.order).map(v => ctx.maybeParam(v));
    str += `.orderby(${p.join(', ')})`;
  }
  if (spec.partition) {
    const p = toArray(spec.partition).map(v => ctx.maybeParam(v));
    str += `.partitionby(${p.join(', ')})`;
  }
  if (spec.rows) {
    str += `.rows(${ctx.maybeParam(spec.rows)})`;
  } else if (spec.range) {
    str += `.range(${ctx.maybeParam(spec.rows)})`;
  }
  return str;
}

function parseParam(param, ctx) {
  param = isObject(param) ? param : { value: param };
  const { select = 'value' } = param;
  const parser = ctx.paramParsers.get(select);
  if (!parser) {
    error(`Unrecognized param type: ${select}`, param);
  }
  if (select === 'value') {
    const { value, date } = param;
    return Array.isArray(value)
      ? `vg.Param.array([${value.map(v => ctx.maybeParam(v)).join(', ')}])`
      : date ? `vg.Param.value(new Date(${JSON.stringify(date)}))`
      : `vg.Param.value(${JSON.stringify(value)})`;
  } else {
    return `vg.Selection.${select}()`;
  }
}

function dataOptions(options) {
  const opt = [];
  for (const key in options) {
    opt.push(`${key}: ${JSON.stringify(options[key])}`);
  }
  return opt.length ? `, { ${opt.join(', ')} }` : '';
}

function parseTableData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { query, type, ...options } = spec;
  if (query) {
    return `\`${create(name, query, options)}\``;
  }
}

function parseParquetData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return `vg.loadParquet("${name}", "${file}"${dataOptions(options)})`;
}

function parseCSVData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return `vg.loadCSV("${name}", "${file}"${dataOptions(options)})`;
}

function parseJSONData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { data, file, type, ...options } = spec;
  const opt = dataOptions(options);
  if (data) {
    const d = '[\n    '
      + data.map(d => JSON.stringify(d)).join(',\n    ')
      + '\n  ]';
    return `vg.loadObjects("${name}", ${d}${opt})`;
  } else {
    return `vg.loadCSV("${name}", "${file}"${opt})`;
  }
}

function fetchJSON(spec) {
  const { data, file } = spec;
  return data
    ? JSON.stringify(data)
    : `await fetch("${file}")\n  .then(r => r.json())`;
}

function parseGeoJSONData(name, spec, ctx) {
  ctx.datasets.set(name, name);
  return { data: fetchJSON(spec) };
}

function parseTopoJSONData(name, spec, ctx) {
  ctx.datasets.set(name, name);
  const json = fetchJSON(spec);
  let data;
  if (spec.feature) {
    ctx.addImport(TOPOJSON, 'feature');
    const object = `json.objects['${spec.feature}']`;
    data = json + `\n  .then(json => feature(json, ${object}).features)`;
  } else {
    ctx.addImport(TOPOJSON, 'mesh');
    const object = spec.mesh ? `json.objects['${spec.mesh}']` : 'undefined';
    const filter = spec.filter === 'interior' ? ', (a, b) => a !== b'
      : spec.filter === 'exterior' ? ', (a, b) => a === b'
      : '';
    data = json + `\n  .then(json => [mesh(json, ${object}${filter})])`;
  }
  return { data };
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

function parseHSpace(spec, ctx) {
  return `${ctx.tab()}vg.hspace(${spec.hspace})`;
}

function parseVSpace(spec, ctx) {
  return `${ctx.tab()}vg.vspace(${spec.vspace})`;
}

function parseInput(spec, ctx) {
  const { input, ...options } = spec;
  const fn = ctx.inputs.get(input);
  if (!isFunction(fn)) {
    error(`Unrecognized input: ${input}`, spec);
  }
  const opt = [];
  for (const key in options) {
    opt.push(`${key}: ${ctx.maybeSelection(options[key])}`);
  }
  return `${ctx.tab()}vg.${input}({ ${opt.join(', ')} })`;
}

function parseVConcat(spec, ctx) {
  ctx.indent();
  const items = spec.vconcat.map(s => parseSpec(s, ctx));
  ctx.undent();
  return `${ctx.tab()}vg.vconcat(\n${items.join(',\n')}\n${ctx.tab()})`;
}

function parseHConcat(spec, ctx) {
  ctx.indent();
  const items = spec.hconcat.map(s => parseSpec(s, ctx));
  ctx.undent();
  return `${ctx.tab()}vg.hconcat(\n${items.join(',\n')}\n${ctx.tab()})`;
}

function parsePlot(spec, ctx) {
  const { plot, ...attributes } = spec;

  ctx.indent();
  const attrs = [
    ...(ctx.plotDefaults ? [`${ctx.tab()}...defaultAttributes`] : []),
    ...Object.keys(attributes).map(key => parseAttribute(spec, key, ctx))
  ];
  const entries = plot.map(e => parseEntry(e, ctx));
  const items = entries.concat(attrs);
  ctx.undent();

  return `${ctx.tab()}vg.plot(\n${items.join(',\n')}\n${ctx.tab()})`;
}

function parseNakedMark(spec, ctx) {
  return parsePlot({ plot: [spec] }, ctx);
}

function parseLegend(spec, ctx) {
  const { legend, ...options } = spec;
  const type = `${legend}Legend`;
  if (!isFunction(ctx.legends.get(type))) {
    error(`Unrecognized legend type: ${legend}`, spec);
  }
  const opt = [];
  for (const key in options) {
    opt.push(`${key}: ${ctx.maybeSelection(options[key])}`);
  }
  return `${ctx.tab()}vg.${type}({ ${opt.join(', ')} })`;
}

function parseAttribute(spec, name, ctx) {
  const fn = ctx.attributes.get(name);
  if (!isFunction(fn)) {
    error(`Unrecognized attribute: ${name}`, spec);
  }
  const value = spec[name];
  const arg = value === 'Fixed' ? 'vg.Fixed' : ctx.maybeParam(value);
  return `${ctx.tab()}vg.${name}(${arg})`;
}

function parseEntry(spec, ctx) {
  return isString(spec.mark) ? parseMark(spec, ctx)
    : isString(spec.legend) ? parseLegend(spec, ctx)
    : isString(spec.select) ? parseInteractor(spec, ctx)
    : error(`Invalid plot entry.`, spec);
}

function parseMark(spec, ctx) {
  const { mark, data, ...options } = spec;

  if (!isFunction(ctx.marks.get(mark))) {
    error(`Unrecognized mark type: ${mark}`, spec);
  }

  const input = parseMarkData(data, ctx);
  const opt = [];
  for (const key in options) {
    opt.push(`${key}: ${parseMarkOption(options[key], ctx)}`);
  }
  const d = input || '';
  const o = opt.length ? `{ ${opt.join(', ')} }` : '';
  let arg = `${d}${o}`;
  if (d && o) {
    ctx.indent();
    arg = `\n${ctx.tab()}${d},\n${ctx.tab()}${o}\n`;
    ctx.undent();
    arg += ctx.tab();
  }
  return `${ctx.tab()}vg.${mark}(${arg})`;
}

function parseMarkData(spec, ctx) {
  if (!spec) return null; // no data, likely a decoration mark
  if (isArray(spec)) return JSON.stringify(spec); // data provided directly
  const { from: table, ...options } = spec;
  if (ctx.datasets.has(table)) {
    // client-managed data, simply pass through
    return ctx.datasets.get(table);
  } else {
    // source-managed data, create from descriptor
    const opt = [];
    for (const key in options) {
      opt.push(`${key}: ${ctx.maybeSelection(options[key])}`);
    }
    const arg = opt.length ? `, { ${opt.join(', ')} }` : '';
    return `vg.from("${table}"${arg})`;
  }
}

function parseMarkOption(spec, ctx) {
  return ctx.maybeTransform(spec) || ctx.maybeParam(spec);
}

function parseInteractor(spec, ctx) {
  const { select, ...options } = spec;
  if (!isFunction(ctx.interactors.get(select))) {
    error(`Unrecognized interactor type: ${select}`, spec);
  }
  const opt = [];
  for (const key in options) {
    opt.push(`${key}: ${ctx.maybeSelection(options[key])}`);
  }
  return `${ctx.tab()}vg.${select}({ ${opt.join(', ')} })`;
}
