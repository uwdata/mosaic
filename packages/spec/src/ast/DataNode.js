import { create } from '@uwdata/mosaic-sql';
import { DATA } from '../constants.js';
import { isArray, isString } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { parseOptions } from './OptionsNode.js';

export const TABLE_DATA = 'table';
export const PARQUET_DATA = 'parquet';
export const CSV_DATA = 'csv';
export const JSON_DATA = 'json';
export const SPATIAL_DATA = 'spatial';

const dataFormats = new Map([
  [TABLE_DATA, parseTableData],
  [PARQUET_DATA, parseParquetData],
  [CSV_DATA, parseCSVData],
  [JSON_DATA, parseJSONData],
  [SPATIAL_DATA, parseSpatialData]
]);

export function parseData(name, spec, ctx) {
  spec = resolveDataSpec(spec);
  if (dataFormats.has(spec.type)) {
    const parse = dataFormats.get(spec.type);
    return parse(name, spec, ctx);
  } else {
    ctx.error(`Unrecognized data format type.`, spec);
  }
}

function parseTableData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { query, type, ...options } = spec;
  return new TableDataNode(name, query, parseOptions(options, ctx));
}

function parseParquetData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return new ParquetDataNode(name, file, parseOptions(options, ctx));
}

function parseCSVData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return new CSVDataNode(name, file, parseOptions(options, ctx));
}

function parseJSONData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { data, file, type, ...options } = spec;
  const opt = parseOptions(options, ctx);
  return data
    ? new LiteralJSONDataNode(name, data, opt)
    : new JSONDataNode(name, file, opt);
}

function parseSpatialData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return new SpatialDataNode(name, file, parseOptions(options, ctx));
}

function resolveDataSpec(spec) {
  if (isArray(spec)) spec = { type: 'json', data: spec };
  if (isString(spec)) spec = { type: 'table', query: spec };
  return { ...spec, type: inferType(spec) };
}

function inferType(spec) {
  return spec.type
    || fileExtension(spec.file)
    || 'table';
}

function fileExtension(file) {
  const idx = file?.lastIndexOf('.');
  return idx > 0 ? file.slice(idx + 1) : null;
}

function resolveFileURL(file, baseURL) {
  return baseURL ? new URL(file, baseURL).toString() : file;
}

function codegenOptions(options, ctx) {
  const code = options?.codegen(ctx);
  return code ? `, ${code}` : '';
}

export class DataNode extends ASTNode {
  constructor(name, format) {
    super(DATA);
    this.name = name;
    this.format = format;
  }
}

export class QueryDataNode extends DataNode {
  constructor(name, format) {
    super(name, format);
  }

  instantiateQuery(ctx) {
    ctx.error('instantiateQuery not implemented');
  }

  codegenQuery(ctx) {
    ctx.error('codegenQuery not implemented');
  }

  instantiate(ctx) {
    const query = this.instantiateQuery(ctx);
    if (query) return query;
  }

  codegen(ctx) {
    const query = this.codegenQuery(ctx);
    if (query) return query;
  }
}

export class TableDataNode extends QueryDataNode {
  constructor(name, query, options) {
    super(name, TABLE_DATA);
    this.query = query?.trim();
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, query, options } = this;
    if (query) {
      return ctx.api.create(name, query, options.instantiate(ctx));
    }
  }

  codegenQuery(ctx) {
    const { name, query, options } = this;
    if (query) {
      return `\`${create(name, query, options.instantiate(ctx))}\``;
    }
  }

  toJSON() {
    const { format, query, options } = this;
    return { type: format, query, ...options.toJSON() };
  }
}

export class FileDataNode extends QueryDataNode {
  constructor(name, format, method, file, options) {
    super(name, format);
    this.file = file;
    this.method = method;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, method, file, options } = this;
    const url = resolveFileURL(file, ctx.baseURL);
    const opt = options?.instantiate(ctx)
    return ctx.api[method](name, url, opt);
  }

  codegenQuery(ctx) {
    const { name, method, file, options } = this;
    const url = resolveFileURL(file, ctx.baseURL);
    const opt = codegenOptions(options, ctx);
    return `${ctx.ns()}${method}("${name}", "${url}"${opt})`;
  }

  toJSON() {
    const { format, file, options } = this;
    return { type: format, file, ...options.toJSON() };
  }
}

export class SpatialDataNode extends FileDataNode {
  constructor(name, file, options) {
    super(name, SPATIAL_DATA, 'loadSpatial', file, options);
  }
}

export class ParquetDataNode extends FileDataNode {
  constructor(name, file, options) {
    super(name, PARQUET_DATA, 'loadParquet', file, options);
  }
}

export class CSVDataNode extends FileDataNode {
  constructor(name, file, options) {
    super(name, CSV_DATA, 'loadCSV', file, options);
  }
}

export class JSONDataNode extends FileDataNode {
  constructor(name, file, options) {
    super(name, JSON_DATA, 'loadJSON', file, options);
  }
}

export class LiteralJSONDataNode extends QueryDataNode {
  constructor(name, data, options) {
    super(name, JSON_DATA);
    this.data = data;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, data, options } = this;
    return ctx.api.loadObjects(name, data, options.instantiate(ctx));
  }

  codegenQuery(ctx) {
    const { name, data, options } = this;
    const opt = options ? ',' + options.codegen(ctx) : '';
    const d = '[\n    '
      + data.map(d => JSON.stringify(d)).join(',\n    ')
      + '\n  ]';
    return `${ctx.ns()}loadObjects("${name}", ${d}${opt})`;
  }

  toJSON() {
    const { format, data, options } = this;
    return { type: format, data, ...options.toJSON() };
  }
}
