import { create, loadCSV, loadJSON, loadObjects, loadParquet } from '@uwdata/mosaic-sql';
import { DATA } from '../constants.js';
import { isArray, isString } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { parseOptions } from './OptionsNode.js';

const TABLE_DATA = 'table';
const PARQUET_DATA = 'parquet';
const CSV_DATA = 'csv';
const JSON_DATA = 'json';
const GEOJSON_DATA = 'geojson';
const TOPOJSON_DATA = 'topojson';

const dataFormats = new Map([
  [TABLE_DATA, parseTableData],
  [PARQUET_DATA, parseParquetData],
  [CSV_DATA, parseCSVData],
  [JSON_DATA, parseJSONData],
  [GEOJSON_DATA, parseGeoJSONData],
  [TOPOJSON_DATA, parseTopoJSONData]
]);

export function parseData(name, spec, ctx) {
  spec = resolveDataSpec(spec, ctx);
  if (dataFormats.has(spec.type)) {
    const parse = dataFormats.get(spec.type);
    return parse(name, spec, ctx);
  } else {
    error(`Unrecognized data format type.`, spec);
  }
}

function parseTableData(name, spec, ctx) {
  const { query, type, ...options } = spec;
  return new TableDataNode(name, query, parseOptions(options, ctx));
}

function parseParquetData(name, spec, ctx) {
  const { file, type, ...options } = spec;
  return new ParquetDataNode(name, file, parseOptions(options, ctx));
}

function parseCSVData(name, spec, ctx) {
  const { file, type, ...options } = spec;
  return new CSVDataNode(name, file, parseOptions(options, ctx));
}

function parseJSONData(name, spec, ctx) {
  const { data, file, type, ...options } = spec;
  const opt = parseOptions(options, ctx);
  return data
    ? new LiteralJSONDataNode(name, data, opt)
    : new JSONDataNode(name, file, opt);
}

function parseGeoJSONData(name, spec) {
  const { data, file } = spec;
  return new GeoJSONDataNode(name, data, file);
}

function parseTopoJSONData(name, spec) {
  const { data, file, ...options } = spec;
  return new TopoJSONDataNode(name, data, file, options);
}

function resolveDataSpec(spec, ctx) {
  if (isArray(spec)) spec = { type: 'json', data: spec };
  if (isString(spec)) spec = { type: 'table', query: spec };
  return {
    ...spec,
    type: inferType(spec),
    file: resolveFile(spec, ctx)
  };
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

// TODO: retain file and generate url?
function resolveFile({ file }, ctx) {
  return file && ctx.baseURL
    ? new URL(file, ctx.baseURL).toString()
    : file;
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

  instantiate(ctx) {
    const query = this.instantiateQuery(ctx);
    if (query) {
      return ctx.coordinator.exec(query);
    }
  }

  codegen(ctx) {
    const query = this.codegenQuery(ctx);
    if (query) {
      return `await ${ctx.ns()}coordinator().exec(\n  ${query}\n);`
    }
  }
}

export class TableDataNode extends QueryDataNode {
  constructor(name, query, options) {
    super(name, TABLE_DATA);
    this.query = query;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, query, options } = this;
    if (query) {
      return create(name, query, options.instantiate(ctx));
    }
  }

  codegenQuery(ctx) {
    const { name, query, options } = this;
    if (query) {
      return create(name, query, options.instantiate(ctx));
    }
  }
}

export class ParquetDataNode extends QueryDataNode {
  constructor(name, file, options) {
    super(name, PARQUET_DATA);
    this.file = file;
    this.options = options;
  }

  instantiateQuery(ctx) {
    return loadParquet(name, file, options?.instantiate(ctx));
  }

  codegenQuery(ctx) {
    const { name, file, options } = this;
    const opt = codegenOptions(options, ctx);
    return `${ctx.ns()}loadParquet("${name}", "${file}"${opt})`;
  }
}

export class CSVDataNode extends QueryDataNode {
  constructor(name, file, options) {
    super(name, CSV_DATA);
    this.file = file;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, file, options } = this;
    return loadCSV(name, file, options?.instantiate(ctx));
  }

  codegenQuery(ctx) {
    const { name, file, options } = this;
    const opt = codegenOptions(options, ctx);
    return `${ctx.ns()}loadCSV("${name}", "${file}"${opt})`;
  }
}

export class JSONDataNode extends QueryDataNode {
  constructor(name, file, options) {
    super(name, JSON_DATA);
    this.file = file;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, file, options } = this;
    return loadJSON(name, file, options?.instantiate(ctx));
  }

  codegenQuery(ctx) {
    const { name, file, options } = this;
    const opt = codegenOptions(options, ctx);
    return `${ctx.ns()}loadJSON("${name}", "${file}"${opt})`;
  }
}

export class LiteralJSONDataNode extends QueryDataNode {
  constructor(name, data, options) {
    super(name, JSON_DATA);
    this.data = data;
    this.options = options;
  }

  instantiateQuery(ctx) {
    const { name, data, options } = spec;
    return loadObjects(name, data, options.instantiate(ctx));
  }

  codegenQuery(ctx) {
    const { name, data, options } = this;
    const opt = options ? ',' + options.codegen(ctx) : '';
    const d = '[\n    '
      + data.map(d => JSON.stringify(d)).join(',\n    ')
      + '\n  ]';
    return `${ctx.ns()}loadObjects("${name}", ${d}${opt})`;
  }
}

export class ClientDataNode extends DataNode {
  constructor(name, format, data, file) {
    super(name, format);
    this.data = data;
    this.file = file;
    this.client = true;
  }

  instantiate(ctx) {
    return this.data ?? ctx.fetch(this.file).then(r => r.json());
  }

  codegenData() {
    const { data, file } = this;
    return data
      ? JSON.stringify(data)
      : `await fetch("${file}")\n  .then(r => r.json())`;
  }

  codegen(ctx) {
    return `const ${this.name} = ${this.codegenData(ctx)};`
  }
}

export class GeoJSONDataNode extends ClientDataNode {
  constructor(name, data, file) {
    super(name, GEOJSON_DATA, data, file);
  }
}

export class TopoJSONDataNode extends ClientDataNode {
  constructor(name, data, file, options) {
    super(name, TOPOJSON_DATA, data, file);
    this.options = options;
  }

  async instantiate(ctx) {
    const json = await super.instantiate(ctx);
    const { options } = this;
    let data;
    if (options.feature) {
      data = feature(json, json.objects[options.feature]);
    } else {
      const object = spec.mesh ? json.objects[options.mesh] : undefined;
      const filter = ({
        interior: (a, b) => a !== b,
        exterior: (a, b) => a === b
      })[options.filter];
      data = mesh(json, object, filter);
    }
    return data && data.features || [data];
  }

  codegenData(ctx) {
    const json = super.codegenData(ctx);
    const { options } = this;

    let data;
    if (options.feature) {
      ctx.addImport(TOPOJSON_DATA, 'feature');
      const object = `json.objects['${options.feature}']`;
      data = json + `\n  .then(json => feature(json, ${object}).features)`;
    } else {
      ctx.addImport(TOPOJSON_DATA, 'mesh');
      const object = options.mesh ? `json.objects['${options.mesh}']` : 'undefined';
      const filter = options.filter === 'interior' ? ', (a, b) => a !== b'
        : options.filter === 'exterior' ? ', (a, b) => a === b'
        : '';
      data = json + `\n  .then(json => [mesh(json, ${object}${filter})])`;
    }
    return data;
  }
}
