import { defineConfig } from 'vitest/config';
import viteConfig from '../vite.config.js';

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    root: import.meta.dirname,
    include: ['**/*.conformance.ts'],
    globalSetup: ['./src/global-setup.ts'],
    reporters: ['default', './src/reporter.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 300_000
  }
});
