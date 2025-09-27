import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/.venv/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/docs/**',
        '**/__pycache__/**',
        '**/coverage/**',
        '**/test-results/**'
      ]
    },
    fs: {
      allow: ['..']
    }
  }
});