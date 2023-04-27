import { createTable } from './create-table.js';

export function loadCSV(db, tableName, fileName, options = {}) {
  const { temp, replace, ...csvOptions } = options;
  const opt = Object.entries({ sample_size: -1, ...csvOptions })
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value).toUpperCase()
        : t === 'string' ? `'${value}'`
        : value;
      return `${key.toUpperCase()}=${v}`;
    })
    .join(', ');
  const select = `SELECT * FROM read_csv_auto('${fileName}', ${opt})`;
  return createTable(db, tableName, select, { temp, replace });
}
