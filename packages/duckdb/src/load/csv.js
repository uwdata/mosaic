import { loadCSV as loadCSVSQL } from '@uwdata/mosaic-sql';

export function loadCSV(db, tableName, fileName, options = {}) {
  return db.exec(loadCSVSQL(tableName, fileName, options));
}
