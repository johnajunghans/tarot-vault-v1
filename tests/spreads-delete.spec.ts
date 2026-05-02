import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { routes } from '@/lib/routes';

test.describe.configure({ mode: 'serial' });

/**
 * Creates a saved spread via the UI and returns its ID.
 *
 * Each delete test seeds its own spread because the test itself consumes the
 * spread — there's nothing to clean up afterwards.
 */
async function createSpread(page: Page): Promise<string> {
  const name = `E2E Delete Test ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  await page.locator('#spread-name').fill(name);
  await page.getByTestId('spread-canvas').dblclick();

  const saveButton = page.getByRole('button', { name: 'Save Spread' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await page.waitForURL('**/personal/spreads');
  await page.waitForLoadState('networkidle');

  const link = page.getByRole('link', { name: `Open spread ${name}` });
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  const match = href?.match(/\/personal\/spreads\/([^?]+)/);
  if (!match) throw new Error(`Could not extract spread ID from href: ${href}`);
  return match[1];
}

test('Test 33 — Delete from view mode navigates to the list and shows a toast', async ({ page }) => {
  const id = await createSpread(page);

  await page.goto(`/personal/spreads/${id}?mode=view`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete Spread' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Delete this spread?')).toBeVisible();

  await dialog.getByRole('button', { name: 'Delete' }).click();

  await page.waitForURL('**/personal/spreads');
  expect(new URL(page.url()).pathname).toBe(routes.personal.spreads.root);

  await expect(page.getByText('Spread deleted')).toBeVisible();
});

test('Test 34 — Delete dialog renders the no-readings variant for a fresh spread', async ({ page }) => {
  const id = await createSpread(page);

  await page.goto(`/personal/spreads/${id}?mode=view`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete Spread' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Single-confirm variant: no "Delete spread only" secondary button, and the
  // confirm label is exactly "Delete" (not the cascade "Delete spread and N
  // reading(s)" form).
  await expect(dialog.getByRole('button', { name: 'Delete spread only' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /Delete spread and \d+ reading/ })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();

  // Clean up the spread we just seeded.
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.waitForURL('**/personal/spreads');
});

test.skip(
  'Test 35 — Delete spread with associated readings shows the cascade variant',
  async () => {
    // Requires a spread with associated readings. Skipped until the readings
    // creation flow is tested. The cascade-delete dialog variant is covered by
    // the ConfirmDialog unit tests.
  }
);

test('Test 36 — Cancel on the delete dialog leaves the spread intact', async ({ page }) => {
  const id = await createSpread(page);

  await page.goto(`/personal/spreads/${id}?mode=view`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete Spread' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Keep it' }).click();

  await expect(dialog).toBeHidden();
  expect(page.url()).toContain(`/personal/spreads/${id}`);
  expect(page.url()).toContain('mode=view');

  // Clean up — delete the spread now that we've confirmed cancel works.
  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete Spread' }).click();
  const cleanupDialog = page.getByRole('dialog');
  await expect(cleanupDialog).toBeVisible();
  await cleanupDialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.waitForURL('**/personal/spreads');
});
