import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, expect, it } from 'vitest';
import { decodeIPC, tableByteLength } from '../src/util/decode-ipc.js';

describe('decodeIPC', () => {
  it('records the byte length of a single buffer', () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!;
    expect(tableByteLength(decodeIPC(bytes))).toBe(bytes.length);
    expect(tableByteLength(decodeIPC(bytes.buffer))).toBe(bytes.length);
  });

  it('records the summed byte length of chunked buffers', () => {
    const chunks = [
      tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!,
      tableToIPC(tableFromArrays({ a: [4, 5] }), {})!
    ];
    const table = decodeIPC(chunks);

    expect(table.numRows).toBe(5);
    expect(tableByteLength(table)).toBe(chunks[0].length + chunks[1].length);
  });

  it('has no byte length for a table it did not decode', () => {
    expect(tableByteLength(tableFromArrays({ a: [1] }))).toBeUndefined();
  });
});
