import { readFile } from 'node:fs/promises';
import { createTable } from './create-table.js';

export async function loadArrow(db, tableName, buffer, options) {
  const bufName = `__ipc__${tableName}`;
  const arrowData = ArrayBuffer.isView(buffer) ? buffer : await readFile(buffer);
  db.con.register_buffer(bufName, [arrowData], true, err => {
    if (err) console.error(err);
  });
  await createTable(db, tableName, `SELECT * FROM ${bufName}`, options);
  db.con.unregister_buffer(bufName);
}
