import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, expect, it } from 'vitest';
import { decodeIPC, tableByteLength } from '../src/util/decode-ipc.js';

describe('decodeIPC', () => {
  it('records the IPC byte length of decoded tables', () => {
    const chunks = [
      tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!,
      tableToIPC(tableFromArrays({ a: [4, 5] }), {})!
    ];
    expect(tableByteLength(decodeIPC(chunks[0]))).toBe(chunks[0].length);
    expect(tableByteLength(decodeIPC(chunks))).toBe(chunks[0].length + chunks[1].length);
    expect(tableByteLength(tableFromArrays({ a: [1] }))).toBeUndefined();
  });
});
