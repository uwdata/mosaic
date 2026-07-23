import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { tableFromIPC } from '@uwdata/flechette';

/**
 * Decode Arrow IPC bytes to a table instance.
 * The default options map date and timestamp values to JS Date objects.
 *
 * The returned Table is annotated with a non-enumerable `byteLength`
 * property that reports the exact size (in bytes) of the input IPC data.
 * This lets byte-budgeted caches (e.g. `lruCache({ maxBytes })`) size an
 * Arrow result precisely without estimating. The property is non-enumerable
 * so it does not appear in iteration, JSON serialization, or object spreads.
 *
 * @param data Arrow IPC bytes.
 * @param options Arrow IPC extraction options.
 *  If unspecified, the default options will extract date and timestamp
 *  values to JS Date objects.
 * @returns A table instance with an attached `byteLength` reflecting the
 *  size of the input IPC bytes.
 */
export function decodeIPC(
  data: ArrayBufferLike | Uint8Array | Uint8Array[],
  options: ExtractionOptions = { useDate: true }
): Table {
  const table = tableFromIPC(data, options);
  const bytes = ipcByteSize(data);
  if (bytes > 0) {
    Object.defineProperty(table, 'byteLength', {
      value: bytes,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  return table;
}

function ipcByteSize(data: ArrayBufferLike | Uint8Array | Uint8Array[]): number {
  if (Array.isArray(data)) {
    let total = 0;
    for (const chunk of data) total += chunk.byteLength;
    return total;
  }
  return (data as ArrayBufferLike | Uint8Array).byteLength ?? 0;
}
