import { test, expect } from './fixtures';
import { routes } from '@/lib/routes';
import path from 'path';

const STORAGE_STATE = path.resolve(__dirname, '.auth/user.json');

test.describe.configure({ mode: 'serial' });

let spreadId: string;
let spreadName: string;

test.beforeAll(async ({ browser }) => {
  spreadName = `E2E Edit Test ${Date.now()}`;
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

async function gotoEditMode(page: import('@playwright/test').Page) {
  await page.goto(`/personal/spreads/${spreadId}?mode=edit`);
  // Wait for the Convex query to resolve and the form to populate from DB.
  await expect(page.locator('#spread-name')).not.toHaveValue('', { timeout: 10_000 });
}

test('Test 27 — edit mode pre-populates the form from the saved spread', async ({ page }) => {
  await gotoEditMode(page);

  await expect(page.locator('#spread-name')).toHaveValue(spreadName);

  const panel = page.getByTestId('spread-settings-panel');
  await expect(panel.getByText('Untitled').first()).toBeVisible();
});

test('Test 28 — Save Changes is disabled until the form becomes dirty', async ({ page }) => {
  await gotoEditMode(page);

  const saveButton = page.getByRole('button', { name: 'Save Changes' });
  await expect(saveButton).toBeDisabled();

  const nameInput = page.locator('#spread-name');
  await nameInput.fill('');
  await nameInput.fill(`${spreadName} edited`);

  await expect(saveButton).toBeEnabled();
});

test.skip(
  'Test 29 — drag a card to a new canvas position',
  async () => {
    // Skipped: SVG coordinate assertions for drag interactions are brittle in
    // CI; covered by unit tests on the canvas model.
  }
);

test('Test 30 — Save Changes persists edits and returns to view mode with a toast', async ({ page }) => {
  await gotoEditMode(page);

  const updatedName = `${spreadName} updated`;
  const nameInput = page.locator('#spread-name');
  await nameInput.fill(updatedName);

  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.waitForURL(/mode=view/);
  expect(page.url()).toContain('mode=view');
  await expect(page.getByText('Spread updated!')).toBeVisible();
});

test('Test 31 — Cancel on a clean form returns to view mode without a dialog', async ({ page }) => {
  await gotoEditMode(page);

  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.waitForURL(/mode=view/);
  expect(page.url()).toContain('mode=view');

  // The discard ConfirmDialog should never have opened.
  await expect(page.getByText('Discard changes?')).toHaveCount(0);
});

test('Test 32 — Cancel on a dirty form prompts the discard dialog and respects both choices', async ({ page }) => {
  await gotoEditMode(page);

  const nameInput = page.locator('#spread-name');
  await nameInput.fill(`${spreadName} dirty`);

  // Choice 1: Keep editing — dialog should close and we should stay in edit mode.
  await page.getByRole('button', { name: 'Cancel' }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Discard changes?')).toBeVisible();

  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(dialog).toBeHidden();
  expect(page.url()).toContain('mode=edit');

  // Choice 2: Discard — should navigate back to view mode.
  await page.getByRole('button', { name: 'Cancel' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Discard' }).click();

  await page.waitForURL(/mode=view/);
  expect(page.url()).toContain('mode=view');
});
