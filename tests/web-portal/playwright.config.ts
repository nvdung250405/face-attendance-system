import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Functional E2E Configuration for Web Portal
 * Encapsulates all output artifacts inside tests/reports/web-portal/ (Local-Only)
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  testIgnore: /.*\.staging\.spec\.ts/,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: '../reports/web-portal/test-results.json' }],
  ],
  outputDir: '../reports/web-portal/test-results',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  /*
  webServer: {
    command: 'cmd.exe /c "npm.cmd run dev -- --port 5173"',
    cwd: '../../app/web-portal',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
  */
});
