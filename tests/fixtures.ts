import { test as base, expect, type Page } from '@playwright/test';
import { routes } from '@/lib/routes';

/**
 * Custom Playwright fixtures shared across all spec files.
 *
 * Spec files should import { test, expect } from this module instead of
 * @playwright/test directly. The authenticated session is wired up centrally
 * via `use.storageState` in playwright.config.ts (populated by global-setup),
 * so individual specs do not need to call test.use({ storageState }).
 */

type Fixtures = {
  /** A `page` that already has the saved Clerk session loaded. */
  authenticatedPage: Page;
  /** A `page` already navigated to /personal/spreads with content rendered. */
  spreadsPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, provide) => {
    await provide(page);
  },

  spreadsPage: async ({ page }, provide) => {
    await page.goto(routes.personal.spreads.root);
    await page.waitForLoadState('networkidle');
    await provide(page);
  },
});

export { expect };
