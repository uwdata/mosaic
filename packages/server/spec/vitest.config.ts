import { defineConfig } from 'vitest/config';
import viteConfig from '../../../vite.config.js';

// Harness unit tests only; the server-backed suite lives in conformance/vitest.config.ts.
export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    include: ['conformance/**/*.test.ts']
  }
});
