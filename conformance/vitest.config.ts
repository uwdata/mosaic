import { defineConfig } from 'vitest/config';
import viteConfig from '../vite.config.js';

// Harness unit tests only; the target-backed suite is vitest.conformance.config.ts.
export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**']
  }
});
