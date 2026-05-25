/**
 * Playwright Configuration
 * E2E testing setup
 */

const baseUse = {
  baseURL: 'http://localhost:5500',
  trace: 'on-first-retry'
};

const config = {
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: baseUse,

  projects: [
    {
      name: 'chromium',
      use: { ...baseUse, browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { ...baseUse, browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { ...baseUse, browserName: 'webkit' }
    }
  ],

  webServer: {
    command: 'npm run dev:node',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI
  }
};

module.exports = config;
