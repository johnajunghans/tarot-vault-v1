import { chromium, type FullConfig } from '@playwright/test';
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
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

  // DEBUG: set PWDEBUG_CLERK=1 to watch the sign-in flow in a real browser.
  const debug = !!process.env.PWDEBUG_CLERK;
  const browser = await chromium.launch({
    headless: !debug,
    slowMo: debug ? 500 : 0,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[browser:pageerror]', err.message));

  // Log Clerk Frontend API requests/responses so we can see why signIn fails.
  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('.clerk.accounts.dev') && !url.includes('clerk.com')) return;
    if (!url.includes('/v1/client/sign_ins') && !url.includes('/v1/client')) return;
    let body = '';
    try {
      body = (await res.text()).slice(0, 800);
    } catch {}
    console.log(`[clerk:${res.status()}]`, res.request().method(), url, body);
  });

  try {
    // Inject the Clerk testing token so the dev instance's bot protection
    // doesn't silently reject our programmatic sign-in. Must be called
    // before any page.goto() that loads Clerk.
    await setupClerkTestingToken({ page });

    await page.goto('http://localhost:3000');

    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    });

    // Confirm signIn actually established a session before we navigate.
    const sessionInfo = await page.evaluate(() => {
      const c = (window as unknown as { Clerk?: { user?: { id?: string }; session?: { id?: string } } }).Clerk;
      return { user: c?.user?.id ?? null, session: c?.session?.id ?? null };
    });
    console.log('[clerk.signIn] result:', sessionInfo);
    if (!sessionInfo.session) {
      throw new Error(
        'clerk.signIn() returned but no session was created. ' +
          'Check: pub/secret keys are from the same Clerk instance, the test user has a password identifier, and the email is verified.',
      );
    }

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
