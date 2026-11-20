import { defaultClientConditions, defineConfig } from 'vite';
import { sourceCondition } from '../../../vite.config.js';

export default defineConfig({
  resolve: {
    conditions: [sourceCondition, ...defaultClientConditions],
  },
  build: {
    outDir: 'mosaic_widget/static',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'index',
    },
  },
});
