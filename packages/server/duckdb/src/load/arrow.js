import { readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { tableFromIPC } from '@uwdata/flechette';

export async function loadArrow(db, tableName, buffer) {
  const arrowData = ArrayBuffer.isView(buffer)
    ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    : await readFile(buffer);
  const table = tableFromIPC(arrowData);

  // Extract column data as row-oriented NDJSON for DuckDB ingestion
  const { names, children } = table;
  const numRows = table.numRows;
  const arrays = children.map(col => col.toArray());

  const lines = [];
  for (let r = 0; r < numRows; r++) {
    const row = {};
    for (let c = 0; c < names.length; c++) {
      row[names[c]] = arrays[c][r] ?? null;
    }
    lines.push(JSON.stringify(row));
  }

  const tempFile = join(tmpdir(), `mosaic_${randomBytes(8).toString('hex')}.json`);
  await writeFile(tempFile, lines.join('\n'));
  try {
    await db.exec(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json('${tempFile}', auto_detect=true)`);
  } finally {
    await unlink(tempFile).catch(() => {});
  }
}
