import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Staging Environment (FAS Web Portal)
 * Targets Live Staging Nginx at http://localhost:3000
 * Encapsulates all output artifacts inside tests/reports/web-portal/ (Local-Only)
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.staging\.spec\.ts/,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: '../reports/web-portal/staging_e2e_results.json' }],
  ],
  outputDir: '../reports/web-portal/test-results',
  use: {
    baseURL: process.env.STAGING_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'staging-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'staging-mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
