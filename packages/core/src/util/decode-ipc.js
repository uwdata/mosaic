import { tableFromIPC } from '@uwdata/flechette';

/**
 * Decode Arrow IPC bytes to a table instance, with an option to map date and
 * timestamp values to JS Date objects.
 * @param {ArrayBuffer | Uint8Array} data Arrow IPC bytes.
 * @returns {import('@uwdata/flechette').Table} A table instance.
 */
export function decodeIPC(data) {
  return tableFromIPC(data, { useDate: true });
}
