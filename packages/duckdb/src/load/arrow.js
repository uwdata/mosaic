import { readFile } from 'node:fs/promises';

export async function loadArrow(db, tableName, buffer) {
  const arrowData = ArrayBuffer.isView(buffer) ? buffer : await readFile(buffer);
  return new Promise((resolve, reject) => {
    db.con.register_buffer(tableName, [arrowData], true, err => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve();
    });
  });
}
