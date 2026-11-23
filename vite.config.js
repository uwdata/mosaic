import { basename } from 'node:path';
import { defaultClientConditions, defaultServerConditions } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

export const sourceCondition = '@uwdata/source';

// Vitest resolves with Vite's server conditions minus `module` in every
// environment, jsdom included; setting conditions replaces that default.
const conditions = process.env.VITEST
  ? defaultServerConditions.filter(c => c !== 'module')
  : defaultClientConditions;

/** @param {string} root */
function project(root, test = {}) {
  return { extends: true, test: { name: basename(root), root, ...test } };
}

export default defineConfig({
  server: {
    open: '/dev/index.html',
    proxy: {
      '/clickhouse/': {
        target: 'http://127.0.0.1:8124',
        rewrite: url => url.replace(/^\/clickhouse/, ''),
        headers: { 'X-ClickHouse-User': 'demo' }
      }
    },
  },
  resolve: {
    conditions: [sourceCondition, ...conditions],
  },
  ssr: {
    resolve: { conditions: [sourceCondition, ...conditions] },
  },
  test: {
    exclude: [...configDefaults.exclude, '**/visual.test.js'],
    projects: [
      project('packages/mosaic/core'),
      project('packages/mosaic/sql', { setupFiles: ['./test/util/matchers.ts'] }),
      project('packages/server/duckdb'),
      project('packages/vgplot/inputs'),
      project('packages/vgplot/plot'),
      project('packages/vgplot/spec'),
      project('packages/vgplot/vgplot'),
    ],
  },
});
