export function loadParquet(db, tableName, fileName, temp = false) {
  const table = `${temp ? 'TEMP ' : ''}TABLE ${tableName}`;
  return db.exec(`CREATE ${table} AS SELECT * FROM read_parquet('${fileName}')`);
}
