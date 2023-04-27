import { readFile } from 'node:fs/promises';
import { createTable } from './create-table.js';

export async function loadArrow(db, tableName, buffer, options = {}) {
  const { select = ['*'], ...tableOptions } = options;
  const bufName = `__ipc__${tableName}`;
  const arrowData = ArrayBuffer.isView(buffer) ? buffer : await readFile(buffer);
  db.con.register_buffer(bufName, [arrowData], true, err => {
    if (err) console.error(err);
  });
  const query = `SELECT ${select.join(', ')} FROM ${bufName}`;
  await createTable(db, tableName, query, tableOptions);
  db.con.unregister_buffer(bufName);
}
