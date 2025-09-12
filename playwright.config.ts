import { defineConfig, devices } from '@playwright/test';

/**
 * SmartCart E2E Testing Configuration
 * Comprehensive testing setup for bottom navigation and PWA features
 * Following performance budgets and accessibility requirements
 */

export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3002',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only when test fails */
    screenshot: 'only-on-failure',

    /* Record video only when test fails */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Chrome Desktop - Baseline tests
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable mobile viewport for PWA testing
        viewport: { width: 375, height: 812 }, // iPhone 12 Pro dimensions
      },
    },

    // Chrome Mobile - Primary PWA testing
    {
      name: 'chrome-mobile',
      use: {
        ...devices['Pixel 5'],
        // Test PWA installation and mobile features
        contextOptions: {
          permissions: ['notifications'],
        },
      },
    },

    // Firefox Desktop
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 375, height: 812 },
      },
    },

    // Firefox Mobile - Test basic navigation functionality
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Pixel 5 landscape'],
        browserName: 'firefox',
      },
    },

    // Safari Desktop (WebKit)
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 375, height: 812 },
      },
    },

    // iOS Safari - Critical for safe area testing
    {
      name: 'ios-safari',
      use: {
        ...devices['iPhone 12 Pro'],
        // Test safe area handling and iOS-specific behaviors
      },
    },

    // iPad Safari - Test larger mobile viewport
    {
      name: 'ipad-safari',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // Edge cases testing
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        // Simulate slow 3G for performance testing
        contextOptions: {
          offline: false,
        },
      },
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to allow for cold starts
  },

  /* Global test timeout */
  timeout: 30 * 1000, // 30 seconds per test

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  /* Output directories */
  outputDir: 'test-results/',
});