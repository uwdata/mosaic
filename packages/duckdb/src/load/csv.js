export async function loadCSV(db, tableName, fileName, options = {}) {
  const opt = Object.entries({ sample_size: -1, ...options })
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value).toUpperCase()
        : t === 'string' ? `'${value}'`
        : value;
      return `${key.toUpperCase()}=${v}`;
    })
    .join(', ');
  return db.exec(`CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${fileName}', ${opt});`);
}
