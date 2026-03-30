import { readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export async function loadArrow(db, tableName, buffer) {
  const arrowData = Array.isArray(buffer) ? Buffer.concat(buffer)
    : ArrayBuffer.isView(buffer) ? Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : await readFile(buffer);
  const tempFile = join(tmpdir(), `mosaic_${randomBytes(8).toString('hex')}.arrow`);
  await writeFile(tempFile, arrowData);
  try {
    await db.exec(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM '${tempFile}'`);
  } finally {
    await unlink(tempFile).catch(() => {});
  }
}
