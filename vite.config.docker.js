import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: null,
    fs: {
      allow: ['..']
    }
  }
});