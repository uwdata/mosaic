import { defineConfig } from 'vitest/config';
import viteConfig from '../../../vite.config.js';

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    env: { CLICKHOUSE_LOCAL: '1' },
    hookTimeout: 15_000,
    include: ['test/dialect/clickhouse/execute.test.ts'],
    setupFiles: ['./test/util/matchers.ts'],
    testTimeout: 15_000,
  },
});
