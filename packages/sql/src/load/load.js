import { create } from './create.js';
import { sqlFrom } from './sql-from.js';

export function load(method, tableName, fileName, options = {}, defaults = {}) {
  const { select = ['*'], where, view, temp, replace, ...file } = options;
  const params = parameters({ ...defaults, ...file });
  const read = `${method}('${fileName}'${params ? ', ' + params : ''})`;
  const filter = where ? ` WHERE ${where}` : '';
  const query = `SELECT ${select.join(', ')} FROM ${read}${filter}`;
  return create(tableName, query, { view, temp, replace });
}

export function loadCSV(tableName, fileName, options) {
  return load('read_csv', tableName, fileName, options, { auto_detect: true, sample_size: -1 });
}

export function loadJSON(tableName, fileName, options) {
  return load('read_json', tableName, fileName, options, { auto_detect: true, json_format: 'auto' });
}

export function loadParquet(tableName, fileName, options) {
  return load('read_parquet', tableName, fileName, options);
}

export function loadObjects(tableName, data, options = {}) {
  const { select = ['*'], ...opt } = options;
  const values = sqlFrom(data);
  const query = select.length === 1 && select[0] === '*'
    ? values
    : `SELECT ${select} FROM ${values}`;
  return create(tableName, query, opt);
}

function parameters(options) {
  return Object.entries(options)
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value)
        : t === 'string' ? `'${value}'`
        : value;
      return `${key}=${v}`;
    })
    .join(', ');
}
