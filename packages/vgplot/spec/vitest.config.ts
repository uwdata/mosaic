import { defineConfig, configDefaults } from 'vitest/config';
import viteConfig from '../../../vite.config.js';

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    exclude: [...configDefaults.exclude, 'test/visual.test.js'],
  },
});
