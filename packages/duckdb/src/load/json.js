import { loadJSON as loadJSONSQL } from "@uwdata/mosaic-sql";

export function loadJSON(db, tableName, fileName, options = {}) {
  const query = loadJSONSQL(tableName, fileName, options)
  return db.exec(query)
}
