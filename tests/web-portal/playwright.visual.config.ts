import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Visual Regression Configuration for Web Portal
 * Encapsulates all output artifacts strictly inside tests/reports/web-portal/ (Local-Only)
 */
export default defineConfig({
  testDir: './visual',
  testMatch: 'visual-responsive.spec.ts',
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
    ['json', { outputFile: '../reports/web-portal/raw_results.json' }],
  ],
  outputDir: '../reports/web-portal/test-results',
  use: {
    baseURL: process.env.VITE_TEST_URL || 'http://localhost:5199',
    timezoneId: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'visual-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
