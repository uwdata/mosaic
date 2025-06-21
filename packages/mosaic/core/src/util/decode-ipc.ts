import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { tableFromIPC } from '@uwdata/flechette';

/**
 * Decode Arrow IPC bytes to a table instance.
 * The default options map date and timestamp values to JS Date objects.
 * @param data Arrow IPC bytes.
 * @param options Arrow IPC extraction options.
 *  If unspecified, the default options will extract date and timestamp
 *  values to JS Date objects.
 * @returns A table instance.
 */
export function decodeIPC(data: ArrayBuffer | Uint8Array, options: ExtractionOptions = { useDate: true }): Table {
  return tableFromIPC(data, options);
}