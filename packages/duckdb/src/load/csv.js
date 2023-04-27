import { createTable } from './create-table.js';
import { parameters } from './parameters.js';

export function loadCSV(db, tableName, fileName, options = {}) {
  const { select = ['*'], temp, replace, ...csvOptions } = options;
  const params = parameters({ auto_detect: true, sample_size: -1, ...csvOptions });
  const query = `SELECT ${select.join(', ')} FROM read_csv('${fileName}', ${params})`;
  return createTable(db, tableName, query, { temp, replace });
}
