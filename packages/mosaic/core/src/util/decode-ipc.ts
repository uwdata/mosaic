import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { tableFromIPC } from '@uwdata/flechette';
import type { ArrowIPCBytes } from '../types.js';

interface SizedTable extends Table {
  byteCount: number;
}

/**
 * Decode Arrow IPC bytes to a table instance.
 * The default options map date and timestamp values to JS Date objects.
 * @param data Arrow IPC bytes.
 * @param options Arrow IPC extraction options.
 *  If unspecified, the default options will extract date and timestamp
 *  values to JS Date objects.
 * @returns A table instance.
 */
export function decodeIPC(
  data: ArrowIPCBytes,
  options: ExtractionOptions = { useDate: true }
): Table {
  const table = tableFromIPC(data, options);
  return Object.assign(table, { byteCount: ipcByteLength(data) });
}

export function tableByteLength(table: Table): number | undefined {
  return (table as Partial<SizedTable>).byteCount;
}

function ipcByteLength(data: ArrowIPCBytes): number {
  return Array.isArray(data)
    ? data.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    : data.byteLength;
}
