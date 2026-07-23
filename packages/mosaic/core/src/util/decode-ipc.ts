import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { tableFromIPC } from '@uwdata/flechette';

/**
 * Decode Arrow IPC bytes to a table instance.
 * The default options map date and timestamp values to JS Date objects.
 *
 * The returned Table is annotated with a non-enumerable `byteLength`
 * property that reports the exact size (in bytes) of the input IPC data.
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

/**
 * Attach a `byteLength` property to a cached value. Used by the
 * connectors to annotate JSON record arrays.
 *
 * @param value The value to annotate. Must be a non-null object.
 * @param bytes The exact byte size to record. Ignored if not positive.
 */
export function annotateByteLength<T extends object>(value: T, bytes: number): T {
  if (bytes > 0) {
    Object.defineProperty(value, 'byteLength', {
      value: bytes,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  return value;
}
