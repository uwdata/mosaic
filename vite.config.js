/** @type {import('vite').UserConfig} */
export default {
  server: {
    open: '/dev/index.html',
  },
  resolve: {
    alias: {
      // Define aliases so that vite picks up the source files.
      '@uwdata/mosaic-core': '/packages/core/src/index.ts',
      '@uwdata/mosaic-sql': '/packages/sql/src/index.js',
      '@uwdata/vgplot': '/packages/vgplot/src/index.js',
      '@uwdata/mosaic-spec': '/packages/spec/src/index.js',
      '@uwdata/mosaic-inputs': '/packages/inputs/src/index.js',
      '@uwdata/mosaic-plot': '/packages/plot/src/index.js',
    }
  },
  test: {
    projects: [
      'packages/*',
    ]
  }
};
