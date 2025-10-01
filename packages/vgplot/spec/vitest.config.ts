import { defineConfig } from 'vite';
import viteConfig from '../../../vite.config.js';

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    exclude: ['test/visual.test.js'], // Exclude visual tests from default run
  },
});
