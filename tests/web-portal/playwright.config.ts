import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for FAS Web Portal
 * Dual-Mode: Mock API for fast CI / Local, Live Staging (http://localhost:3000) for staging verification.
 * Encapsulates all output artifacts inside tests/reports/web-portal/ (Local-Only)
 */
const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || (isCI ? 'http://localhost:5173' : 'http://localhost:3000');

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: '../reports/web-portal/test-results.json' }],
  ],
  outputDir: '../reports/web-portal/test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
