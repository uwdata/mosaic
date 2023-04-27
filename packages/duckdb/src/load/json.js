import { createTable } from './create-table.js';
import { parameters } from './parameters.js';

export function loadJSON(db, tableName, fileName, options = {}) {
  const { select = ['*'], temp, replace, ...jsonOptions } = options;
  const params = parameters({ auto_detect: true, json_format: 'auto', ...jsonOptions });
  const query = `SELECT ${select.join(', ')} FROM read_json('${fileName}', ${params})`;
  return createTable(db, tableName, query, { temp, replace });
}
