import { defineConfig, devices } from '@playwright/test';

// BASE_URL lets a pipeline point the suite at a deployed environment
// (e.g. staging). Without it, Playwright starts the bundled demo app itself.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  // QA Nerve Center runs `playwright test --project=chromium`, so this name must stay.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node app/server.js',
        url: 'http://localhost:3100/health',
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
