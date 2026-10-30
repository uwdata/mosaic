// oxlint-disable no-unused-vars no-use-before-define
import type { CreateQuery } from '@uwdata/mosaic-sql';
import { createTable } from '@uwdata/mosaic-sql';

import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { DATA } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type {
  DataDefinition,
  DataFile,
  DataTable,
  DataParquet,
  DataCSV,
  DataSpatial,
  DataJSON,
  DataJSONObjects,
  JSONValue,
} from '../spec/Data.js';
import { isArray, isString } from '../util.js';
import { ASTNode } from './ASTNode.js';
import type { OptionsNode } from './OptionsNode.js';
import { parseOptions } from './OptionsNode.js';

export const TABLE_DATA = 'table';
export const PARQUET_DATA = 'parquet';
export const CSV_DATA = 'csv';
export const JSON_DATA = 'json';
export const SPATIAL_DATA = 'spatial';

type FileType = 'parquet' | 'csv' | 'json' | 'spatial';
type LoadMethod = 'loadParquet' | 'loadCSV' | 'loadJSON' | 'loadSpatial';
type Format = FileType | 'table';
type ParseFn =
  | typeof parseTableData
  | typeof parseParquetData
  | typeof parseCSVData
  | typeof parseJSONData
  | typeof parseSpatialData;
type DataTyped = DataCSV | DataJSON | DataParquet | DataSpatial | DataTable;

const dataFormats = new Map<Format, ParseFn>([
  [TABLE_DATA, parseTableData],
  [PARQUET_DATA, parseParquetData],
  [CSV_DATA, parseCSVData],
  [JSON_DATA, parseJSONData],
  [SPATIAL_DATA, parseSpatialData],
]);

/** Parse a data definition spec. */
export function parseData(
  name: string,
  spec: DataDefinition,
  ctx: ParseContext,
): ReturnType<ParseFn> {
  const def = resolveDataSpec(spec, ctx);
  // oxlint-disable-next-line typescript/no-non-null-assertion (`def.type` has been narrowed to all that exist)
  const parse = dataFormats.get(def.type)!;
  return parse(name, def, ctx);
}

function hasType(spec: DataTyped | DataJSONObjects | DataFile): spec is DataTyped {
  return Boolean('type' in spec && spec.type);
}

function resolveDataSpec(
  spec: DataDefinition,
  ctx: ParseContext,
): DataTyped | (DataJSONObjects & { type: 'json' }) {
  if (isArray(spec)) {
    return { type: 'json', data: spec };
  }
  if (isString(spec)) {
    return { type: 'table', query: spec };
  }
  if (hasType(spec)) {
    return spec;
  }
  if ('data' in spec) {
    return { ...spec, type: 'json' };
  }

  if ('file' in spec) {
    const { file } = spec;
    const idx = file.lastIndexOf('.');
    if (idx > 0) {
      const fileType = file.slice(idx + 1);
      switch (fileType) {
        case 'parquet': {
          return { ...spec, type: fileType };
        }
        case 'csv': {
          return { ...spec, type: fileType };
        }
        case 'json': {
          return { ...spec, type: fileType };
        }
        default: {
          break;
        }
      }
    }
  }
  ctx.error('Unrecognized data format type.', spec);
}

function parseTableData(name: string, spec, ctx: ParseContext): TableDataNode {
  const { query, type, ...options } = spec;
  return new TableDataNode(name, query, parseOptions(options, ctx));
}

function parseParquetData(name: string, spec, ctx: ParseContext): ParquetDataNode {
  const { file, type, ...options } = spec;
  return new ParquetDataNode(name, file, parseOptions(options, ctx));
}

function parseCSVData(name: string, spec, ctx: ParseContext): CSVDataNode {
  const { file, type, ...options } = spec;
  return new CSVDataNode(name, file, parseOptions(options, ctx));
}

function parseJSONData(name: string, spec, ctx: ParseContext): LiteralJSONDataNode | JSONDataNode {
  const { data, file, type, ...options } = spec;
  const opt = parseOptions(options, ctx);
  return data ? new LiteralJSONDataNode(name, data, opt) : new JSONDataNode(name, file, opt);
}

function parseSpatialData(name: string, spec, ctx: ParseContext): SpatialDataNode {
  const { file, type, ...options } = spec;
  return new SpatialDataNode(name, file, parseOptions(options, ctx));
}

function resolveFileURL(file: string, baseURL: string | null | undefined): string {
  return baseURL ? new URL(file, baseURL).toString() : file;
}

function codegenOptions(options: OptionsNode, ctx: CodegenContext): string {
  const code = options?.codegen(ctx);
  return code ? `, ${code}` : '';
}

export abstract class DataNode<
  F extends Format = Format,
  J extends JSONValue = JSONValue,
> extends ASTNode<CreateQuery, J> {
  readonly name: string;
  readonly format: F;
  constructor(name: string, format: F) {
    super(DATA);
    this.name = name;
    this.format = format;
  }
}

export abstract class QueryDataNode<F extends Format> extends DataNode<F> {
  /** Instantiate a table creation query. */
  abstract instantiateQuery(ctx: InstantiateContext): CreateQuery;

  /** Code generate a table creation query. */
  abstract codegenQuery(ctx: CodegenContext): string;

  instantiate(ctx: InstantiateContext): CreateQuery {
    return this.instantiateQuery(ctx);
  }

  codegen(ctx: CodegenContext): string {
    return this.codegenQuery(ctx);
  }
}

export class TableDataNode extends QueryDataNode<'table'> {
  readonly query: string;
  readonly options: OptionsNode;
  constructor(name: string, query: string, options: OptionsNode) {
    super(name, TABLE_DATA);
    this.query = query.trim();
    this.options = options;
  }

  instantiateQuery(ctx: InstantiateContext): CreateQuery {
    const { name, query, options } = this;
    return ctx.api.createTable(name, query, options.instantiate(ctx));
  }

  codegenQuery(ctx: CodegenContext): string {
    const { name, query, options } = this;
    return `\`${createTable(name, query, options.instantiate(ctx))}\``;
  }

  toJSON(): { type: 'table'; query: string } {
    const { format, query, options } = this;
    return { type: format, query, ...options.toJSON() };
  }
}

export class FileDataNode<F extends FileType, M extends LoadMethod> extends QueryDataNode<F> {
  readonly file: string;
  readonly method: M;
  readonly options: OptionsNode;
  constructor(name: string, format: F, method: M, file: string, options: OptionsNode) {
    super(name, format);
    this.file = file;
    this.method = method;
    this.options = options;
  }

  instantiateQuery(ctx: InstantiateContext): CreateQuery {
    const { name, method, file, options } = this;
    const url = resolveFileURL(file, ctx.baseURL);
    const opt = options?.instantiate(ctx);
    return ctx.api[method](name, url, opt);
  }

  codegenQuery(ctx: CodegenContext): string {
    const { name, method, file, options } = this;
    const url = resolveFileURL(file, ctx.baseURL);
    const opt = codegenOptions(options, ctx);
    return `${ctx.ns()}${method}("${name}", "${url}"${opt})`;
  }

  toJSON(): { type: F; file: string } {
    const { format, file, options } = this;
    return { type: format, file, ...options.toJSON() };
  }
}

export class SpatialDataNode extends FileDataNode<'spatial', 'loadSpatial'> {
  constructor(name: string, file: string, options: OptionsNode) {
    super(name, SPATIAL_DATA, 'loadSpatial', file, options);
  }
}

export class ParquetDataNode extends FileDataNode<'parquet', 'loadParquet'> {
  constructor(name: string, file: string, options: OptionsNode) {
    super(name, PARQUET_DATA, 'loadParquet', file, options);
  }
}

export class CSVDataNode extends FileDataNode<'csv', 'loadCSV'> {
  constructor(name: string, file: string, options: OptionsNode) {
    super(name, CSV_DATA, 'loadCSV', file, options);
  }
}

export class JSONDataNode extends FileDataNode<'json', 'loadJSON'> {
  constructor(name: string, file: string, options: OptionsNode) {
    super(name, JSON_DATA, 'loadJSON', file, options);
  }
}

export class LiteralJSONDataNode extends QueryDataNode<'json'> {
  readonly data: DataJSONObjects['data'];
  readonly options: OptionsNode;
  constructor(name: string, data: DataJSONObjects['data'], options: OptionsNode) {
    super(name, JSON_DATA);
    this.data = data;
    this.options = options;
  }

  instantiateQuery(ctx: InstantiateContext): CreateQuery {
    const { name, data, options } = this;
    return ctx.api.loadObjects(name, data, options.instantiate(ctx));
  }

  codegenQuery(ctx: CodegenContext): string {
    const { name, data, options } = this;
    const opt = options ? `,${options.codegen(ctx)}` : '';
    // oxlint-disable-next-line no-shadow
    const d = `[\n    ${data.map((d) => JSON.stringify(d)).join(',\n    ')}\n  ]`;
    return `${ctx.ns()}loadObjects("${name}", ${d}${opt})`;
  }

  toJSON(): Record<string, JSONValue> {
    const { format, data, options } = this;
    return { type: format, data, ...options.toJSON() };
  }
}
