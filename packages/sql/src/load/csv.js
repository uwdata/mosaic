import { create } from './create.js';
import { parameters } from './parameters.js';

export function loadCSV(tableName, fileName, options = {}) {
  const { select = ['*'], temp, replace, ...csvOptions } = options;
  const params = parameters({ auto_detect: true, sample_size: -1, ...csvOptions });
  const query = `SELECT ${select.join(', ')} FROM read_csv('${fileName}', ${params})`;
  return create(tableName, query, { temp, replace });
}
