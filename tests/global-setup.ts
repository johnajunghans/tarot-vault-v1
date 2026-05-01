import { chromium, type FullConfig } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Playwright global setup: authenticate one test user via Clerk and persist
 * the resulting browser storage state to tests/.auth/user.json. Every spec
 * then reuses that session via `use.storageState` in playwright.config.ts.
 *
 * Required env vars (see .env.local or CI secrets):
 *   - E2E_CLERK_USER_EMAIL
 *   - E2E_CLERK_USER_PASSWORD
 *   - CLERK_SECRET_KEY                   (required by @clerk/testing)
 *   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (used by the app already)
 *
 * Why @clerk/testing instead of raw UI clicks:
 *   clerkSetup() issues a "testing token" that bypasses Clerk's bot
 *   protection / rate limiting for the test environment, and clerk.signIn()
 *   uses Clerk's frontend API directly rather than scraping the hosted
 *   sign-in form — so it's resilient to UI changes. We still use a real
 *   browser context so cookies/localStorage are captured for storageState.
 *
 * Notes / Clerk dashboard requirements:
 *   - The test user must exist in Clerk and have a password identifier set.
 *   - For non-development Clerk instances, the `testing-token` API must be
 *     enabled (it is automatic on dev instances).
 */
export default async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing E2E_CLERK_USER_EMAIL or E2E_CLERK_USER_PASSWORD. ' +
        'Set them in .env.local (or CI secrets) before running Playwright.',
    );
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'Missing CLERK_SECRET_KEY. @clerk/testing needs it to mint a testing token.',
    );
  }

  await clerkSetup();

  const authDir = path.join(__dirname, '.auth');
  const storageStatePath = path.join(authDir, 'user.json');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    });

    await page.goto('http://localhost:3000/personal/spreads');
    await page.waitForURL(/\/personal(\/spreads)?/);

    // Convex hydrates after Clerk auth; wait for the spreads page to render
    // its real content rather than a loading skeleton before we snapshot.
    await page.waitForLoadState('networkidle');

    await context.storageState({ path: storageStatePath });
  } finally {
    await browser.close();
  }
}
