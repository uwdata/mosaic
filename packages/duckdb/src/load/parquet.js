import { loadParquet as loadParquetSQL } from "@uwdata/mosaic-sql";

export function loadParquet(db, tableName, fileName, options = {}) {
  const query = loadParquetSQL(tableName, fileName, options)
  return db.exec(query)
}
