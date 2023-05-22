import { create } from './create.js';

export function loadParquet(tableName, fileName, options = {}) {
  const { select = ['*'], ...tableOptions } = options;
  const query = `SELECT ${select.join(', ')} FROM read_parquet('${fileName}')`;
  return create(tableName, query, tableOptions);
}
