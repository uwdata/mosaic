import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { tableFromIPC } from '@uwdata/flechette';

const byteLengths = new WeakMap<Table, number>();

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
  data: ArrayBufferLike | Uint8Array | Uint8Array[],
  options: ExtractionOptions = { useDate: true }
): Table {
  const table = tableFromIPC(data, options);
  byteLengths.set(table, ipcByteLength(data));
  return table;
}

export function tableByteLength(table: Table): number | undefined {
  return byteLengths.get(table);
}

function ipcByteLength(data: ArrayBufferLike | Uint8Array | Uint8Array[]): number {
  return Array.isArray(data)
    ? data.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    : data.byteLength;
}
