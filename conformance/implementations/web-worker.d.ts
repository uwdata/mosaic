// web-worker 1.2 ships no types; only the constructor is used here and the
// instance is handed straight to duckdb-wasm.
declare module 'web-worker' {
  const Worker: new (url: string, options?: { type?: 'classic' | 'module'; name?: string }) => {
    postMessage(message: unknown, transfer?: unknown[]): void;
    terminate(): void;
    addEventListener(type: string, listener: (event: unknown) => void): void;
    removeEventListener(type: string, listener: (event: unknown) => void): void;
  };
  export default Worker;
}
