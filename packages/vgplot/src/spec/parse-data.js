import {
  create, loadCSV, loadJSON, loadParquet, sqlFrom
} from '@uwdata/mosaic-sql';
import { error, isArray, isString } from './util.js';

export function parseData(name, spec, ctx) {
  spec = resolveDataSpec(spec, ctx);
  const parse = ctx.dataFormats.get(spec.type);
  if (parse) {
    return parse(name, spec, ctx);
  } else {
    error(`Unrecognized data format type.`, spec);
  }
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

function resolveFile({ file }, ctx) {
  return file && ctx.baseURL
    ? new URL(file, ctx.baseURL).toString()
    : file;
}

export function parseTableData(name, spec) {
  if (spec.query) {
    return create(name, spec.query, { temp: true });
  }
}

export function parseParquetData(name, spec) {
  return loadParquet(name, spec.file);
}

export function parseCSVData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { file, type, ...options } = spec;
  return loadCSV(name, file, options);
}

export function parseJSONData(name, spec) {
  // eslint-disable-next-line no-unused-vars
  const { data, file, type, ...options } = spec;
  if (data) {
    const { select = '*' } = spec;
    return create(name, `SELECT ${select} FROM ${sqlFrom(data)}`, { temp: true });
  } else {
    return loadJSON(name, file, options);
  }
}
