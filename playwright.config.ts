import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * E2E test configuration.
 *
 * Required environment variables (loaded from .env.local or CI secrets):
 *   - E2E_CLERK_USER_EMAIL      Test user email for Clerk sign-in
 *   - E2E_CLERK_USER_PASSWORD   Test user password for Clerk sign-in
 *   - CLERK_SECRET_KEY          Clerk backend secret (required by @clerk/testing
 *                               to issue testing tokens that bypass bot protection)
 *   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  Clerk frontend key (already used by app)
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  globalSetup: require.resolve('./tests/global-setup.ts'),

  use: {
    baseURL: 'http://localhost:3000',
    storageState: path.join(__dirname, 'tests/.auth/user.json'),
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
