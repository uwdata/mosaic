import { readFile } from 'node:fs/promises';

export async function loadArrow(db, tableName, buffer) {
  const bufName = `__ipc__${tableName}`;
  const arrowData = ArrayBuffer.isView(buffer) ? buffer : await readFile(buffer);
  db.con.register_buffer(bufName, [arrowData], true, err => {
    if (err) console.error(err);
  });
  await db.exec(`CREATE TABLE ${tableName} AS SELECT * FROM ${bufName}`);
  db.con.unregister_buffer(bufName);
}
