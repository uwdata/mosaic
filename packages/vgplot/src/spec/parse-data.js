import { sql } from '@uwdata/mosaic-sql';
import { error, isArray, isString } from './util.js';

export function parseData(name, spec, ctx) {
  spec = resolveDataSpec(spec, ctx);
  const parse = ctx.formats.get(spec.format);
  if (parse) {
    return parse(name, spec, ctx);
  } else {
    error(`Unrecognized data format.`, spec);
  }
}

function resolveDataSpec(spec, ctx) {
  if (isArray(spec)) spec = { format: 'json', data: spec };
  if (isString(spec)) spec = { format: 'table', query: spec };
  return {
    ...spec,
    format: inferFormat(spec),
    file: resolveFile(spec, ctx)
  };
}

function inferFormat(spec) {
  return spec.format
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

export function parseTableData(name, spec, ctx) {
  if (spec.query) {
    return ctx.create(name, spec.query);
  }
}

export function parseParquetData(name, spec, ctx) {
  const { file, select = '*' } = spec;
  return ctx.createFrom(
    name,
    sql`read_parquet('${file}')`,
    select
  );
}

export function parseCSVData(name, spec, ctx) {
  // eslint-disable-next-line no-unused-vars
  const { file, format, select = '*', ...options } = spec;
  const opt = Object.entries({ sample_size: -1, ...options })
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value).toUpperCase()
        : t === 'string' ? `'${value}'`
        : value;
      return `${key.toUpperCase()}=${v}`;
    })
    .join(', ');
  return ctx.createFrom(
    name,
    sql`read_csv_auto('${file}', ${opt})`,
    select
  );
}
