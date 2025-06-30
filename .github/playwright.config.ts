import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 120_000,            // 2 minutes max per test
  testDir: './tests',          // where your test files live
  use: {
    headless: true,            // run browser headless (no UI)
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,   // if any HTTPS issues
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [ ['list'], ['json', { outputFile: 'results.json' }] ],
  retries: 1,                  // retry once on failure
});
