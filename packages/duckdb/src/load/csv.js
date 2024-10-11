import { loadCSV as loadCSVSQL } from "@uwdata/mosaic-sql";

export function loadCSV(db, tableName, fileName, options = {}) {
  const query = loadCSVSQL(tableName, fileName, options)
  return db.exec(query)
}
