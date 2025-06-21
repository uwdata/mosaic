import path from "path";

/** @type {import('vite').UserConfig} */
export default {
  server: {
    open: '/dev/index.html',
  },
  resolve: {
    alias: {
      // Define aliases so that vite picks up the source files.
      '@uwdata/mosaic-core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@uwdata/mosaic-sql': path.resolve(__dirname, './packages/sql/src/index.ts'),
      '@uwdata/vgplot': path.resolve(__dirname, './packages/vgplot/src/index.js'),
      '@uwdata/mosaic-spec': path.resolve(__dirname, './packages/spec/src/index.js'),
      '@uwdata/mosaic-inputs': path.resolve(__dirname, './packages/inputs/src/index.js'),
      '@uwdata/mosaic-plot': path.resolve(__dirname, './packages/plot/src/index.js'),
    }
  },
  test: {
    projects: [
      'packages/*',
    ]
  }
};
