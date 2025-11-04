import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'vgplot',
      formats: ['umd'],
      fileName: (format) => `vgplot.${format}.js`
    },
    rollupOptions: {
      // No external dependencies for UMD build - bundle everything
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        globals: {}
      }
    },
    outDir: 'dist/umd',
    emptyOutDir: true
  }
});
