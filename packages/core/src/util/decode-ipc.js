/** @import { ExtractionOptions, Table } from '@uwdata/flechette' */
import { tableFromIPC } from '@uwdata/flechette';

/** @export { ExtractionOptions } */

/**
 * Decode Arrow IPC bytes to a table instance.
 * The default options map date and timestamp values to JS Date objects.
 * @param {ArrayBuffer | Uint8Array} data Arrow IPC bytes.
 * @param {ExtractionOptions} [options] Arrow IPC extraction options.
 *  If unspecified, the default options will extract date and timestamp
 *  values to JS Date objects.
 * @returns {Table} A table instance.
 */
export function decodeIPC(data, options = { useDate: true }) {
  return tableFromIPC(data, options);
}
