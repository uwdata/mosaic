import { loadJSON as loadJSONSQL } from '@uwdata/mosaic-sql';

export function loadJSON(db, tableName, fileName, options = {}) {
  return db.exec(loadJSONSQL(tableName, fileName, options));
}
