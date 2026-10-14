import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vitest.config.js';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    env: { CLICKHOUSE_LOCAL: '1' },
    hookTimeout: 15_000,
    include: ['test/dialect/clickhouse/execute.test.ts'],
    testTimeout: 15_000,
  },
}));
