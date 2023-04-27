import { createTable } from './create-table.js';

export function loadParquet(db, tableName, fileName, options) {
  return createTable(db, tableName, `SELECT * FROM read_parquet('${fileName}')`, options);
}
