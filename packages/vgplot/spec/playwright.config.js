import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 1,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  testMatch: '**/visual*.test.js',

  webServer: [
    {
      command: 'pnpm exec vite --port 5173 --host --config vite.config.docker.js',
      port: 5173,
      reuseExistingServer: true,
      cwd: '../../../',
    },
    {
      command: 'node packages/server/duckdb/bin/run-server.js',
      port: 3000,
      reuseExistingServer: true,
      cwd: '../../../',
    },
  ],
});
