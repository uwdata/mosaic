import { loadParquet as loadParquetSQL } from '@uwdata/mosaic-sql';

export function loadParquet(db, tableName, fileName, options = {}) {
  return db.exec(loadParquetSQL(tableName, fileName, options));
}
