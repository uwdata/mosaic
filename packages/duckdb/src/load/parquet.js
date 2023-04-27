import { createTable } from './create-table.js';

export function loadParquet(db, tableName, fileName, options = {}) {
  const { select = ['*'], ...tableOptions } = options;
  const query = `SELECT ${select.join(', ')} FROM read_parquet('${fileName}')`;
  return createTable(db, tableName, query, tableOptions);
}
