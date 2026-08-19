import path from 'path';

const dirname = import.meta.dirname;

/** @type {import('vite').UserConfig} */
export default {
  server: {
    open: '/dev/index.html',
  },
  resolve: {
    alias: {
      // Define aliases so that vite picks up the source files.
      '@uwdata/mosaic-core/node-connector': path.resolve(dirname, './packages/mosaic/core/src/connectors/NodeConnector.ts'),
      '@uwdata/mosaic-core': path.resolve(dirname, './packages/mosaic/core/src/index.ts'),
      '@uwdata/mosaic-sql': path.resolve(dirname, './packages/mosaic/sql/src/index.ts'),
      '@uwdata/vgplot': path.resolve(dirname, './packages/vgplot/vgplot/src/index.js'),
      '@uwdata/mosaic-spec': path.resolve(dirname, './packages/vgplot/spec/src/index.ts'),
      '@uwdata/mosaic-inputs': path.resolve(dirname, './packages/vgplot/inputs/src/index.js'),
      '@uwdata/mosaic-plot': path.resolve(dirname, './packages/vgplot/plot/src/index.js'),
    }
  },
  test: {
    projects: [
      'packages/mosaic/*',
      'packages/vgplot/*',
      'packages/server/*',
    ]
  }
};
