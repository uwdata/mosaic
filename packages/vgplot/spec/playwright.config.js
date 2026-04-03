import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Run all tests in parallel.
  fullyParallel: true,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  testMatch: '**/visual*.test.js',

  webServer: {
    command: 'pnpm exec vite --port 5173 --host --config vite.config.docker.js',
    port: 5173,
    reuseExistingServer: true,
    cwd: '../../../',
  },
});
