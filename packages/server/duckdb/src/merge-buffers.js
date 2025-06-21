export function mergeBuffers(buffers) {
  const len = buffers.reduce((a, b) => a + (b ? b.length : 0), 0);
  const buf = new Uint8Array(len);

  for (let i = 0, offset = 0; i < buffers.length; ++i) {
    if (buffers[i]) {
      buf.set(buffers[i], offset);
      offset += buffers[i].length;
    }
  }

  return buf;
}
