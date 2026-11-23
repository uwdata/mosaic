import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
  server: {
    open: false,
    watch: null,
    fs: {
      allow: ['..']
    }
  }
}));
