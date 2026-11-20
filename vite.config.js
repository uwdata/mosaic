import { defaultClientConditions, defaultServerConditions } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

export const sourceCondition = '@uwdata/source';

// Vitest resolves with Vite's server conditions minus `module` in every
// environment, jsdom included; setting conditions replaces that default.
const vitestConditions = defaultServerConditions.filter(c => c !== 'module');
const clientConditions = process.env.VITEST ? vitestConditions : defaultClientConditions;
const serverConditions = process.env.VITEST ? vitestConditions : defaultServerConditions;

export default defineConfig({
  server: {
    open: '/dev/index.html',
  },
  resolve: {
    conditions: [sourceCondition, ...clientConditions],
  },
  ssr: {
    resolve: {
      conditions: [sourceCondition, ...serverConditions],
    },
  },
  test: {
    projects: [
      { extends: true, test: { name: '@uwdata/mosaic-core', root: 'packages/mosaic/core' } },
      {
        extends: true,
        test: {
          name: '@uwdata/mosaic-sql',
          root: 'packages/mosaic/sql',
          setupFiles: ['./test/util/matchers.ts'],
        },
      },
      { extends: true, test: { name: '@uwdata/mosaic-duckdb', root: 'packages/server/duckdb' } },
      { extends: true, test: { name: '@uwdata/mosaic-inputs', root: 'packages/vgplot/inputs' } },
      { extends: true, test: { name: '@uwdata/mosaic-plot', root: 'packages/vgplot/plot' } },
      {
        extends: true,
        test: {
          name: '@uwdata/mosaic-spec',
          root: 'packages/vgplot/spec',
          exclude: [...configDefaults.exclude, 'test/visual.test.js'],
        },
      },
      { extends: true, test: { name: '@uwdata/vgplot', root: 'packages/vgplot/vgplot' } },
    ],
  },
});
