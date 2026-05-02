import { test, expect } from './fixtures';
import { routes } from '@/lib/routes';
import path from 'path';

const STORAGE_STATE = path.resolve(__dirname, '.auth/user.json');

test.describe.configure({ mode: 'serial' });

let spreadId: string;
let spreadName: string;

test.beforeAll(async ({ browser }) => {
  spreadName = `E2E View Test ${Date.now()}`;
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  try {
    await page.goto(routes.personal.spreads.new.root);
    await page.waitForLoadState('networkidle');

    await page.locator('#spread-name').fill(spreadName);
    await page.getByTestId('spread-canvas').dblclick();

    const saveButton = page.getByRole('button', { name: 'Save Spread' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await page.waitForURL('**/personal/spreads');
    await page.waitForLoadState('networkidle');

    const link = page.getByRole('link', { name: `Open spread ${spreadName}` });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    const match = href?.match(/\/personal\/spreads\/([^?]+)/);
    if (!match) throw new Error(`Could not extract spread ID from href: ${href}`);
    spreadId = match[1];
  } finally {
    await context.close();
  }
});

test.afterAll(async ({ browser }) => {
  if (!spreadId) return;
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  try {
    await page.goto(`/personal/spreads/${spreadId}?mode=view`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete Spread' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await page.waitForURL('**/personal/spreads');
  } catch {
    // Best-effort cleanup; don't fail the suite if the spread is already gone.
  } finally {
    await context.close();
  }
});

test('Test 21 — view mode shows Spread Details panel with the spread name', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  const panel = page.getByTestId('spread-settings-panel');
  await expect(panel.getByText('Spread Details')).toBeVisible();
  await expect(panel.getByText(spreadName)).toBeVisible();
});

test('Test 22 — view mode lists at least one position in the panel', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  const panel = page.getByTestId('spread-settings-panel');
  await expect(panel.getByText('Positions')).toBeVisible();
  await expect(panel.getByText('Untitled').first()).toBeVisible();
});

test('Test 23 — clicking a position tile opens the Position 1 details panel', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  const panel = page.getByTestId('spread-settings-panel');
  await panel.getByText('Untitled').first().click();

  await expect(page.getByText('Position 1')).toBeVisible();
  // The right panel renders both "Name" and "Reversals" labels for any card.
  await expect(page.getByText('Reversals')).toBeVisible();
});

test('Test 24 — canvas double-click is a no-op in view mode', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  const panel = page.getByTestId('spread-settings-panel');
  const tiles = panel.getByText('Untitled');
  const initialCount = await tiles.count();

  await page.getByTestId('spread-canvas').dblclick();

  // Allow time for any (incorrect) state update to flush.
  await page.waitForTimeout(250);

  await expect(tiles).toHaveCount(initialCount);
});

test('Test 25 — Edit Spread button navigates to ?mode=edit', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  // The "Edit Spread" action is a link-type ActionDescriptor, but it's rendered
  // through base-ui's Button primitive, which keeps role="button" even with a
  // <Link> as the rendered element.
  await page.getByRole('button', { name: 'Edit Spread' }).click();

  await page.waitForURL(/mode=edit/);
  expect(page.url()).toContain('mode=edit');
});

test('Test 26 — Use as template seeds a draft on the new spread route', async ({ page }) => {
  await page.goto(`/personal/spreads/${spreadId}?mode=view`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: /Use as template/ }).click();

  await page.waitForURL(/\/personal\/spreads\/new\?draft=/);
  await expect(page.locator('#spread-name')).toHaveValue(/.+\(copy\)/);

  // Cleanup: drafts are stored in localStorage and would otherwise leak into
  // subsequent runs that load the list page.
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('spread-draft-'))
      .forEach((k) => localStorage.removeItem(k));
  });
});
