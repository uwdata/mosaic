import { defineConfig } from 'vitest/config';
import viteConfig from '../../../vite.config.js';

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    env: { CLICKHOUSE_EXAMPLES: '1' },
    hookTimeout: 60_000,
    include: ['test/clickhouse-examples.test.js'],
    testTimeout: 30_000,
  },
});
