import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { routes } from '@/lib/routes';
import path from 'path';

const STORAGE_STATE = path.resolve(__dirname, '.auth/user.json');

test.describe.configure({ mode: 'serial' });

// Use a shared timestamp suffix so the two test spreads sort alphabetically
// against each other regardless of any other spreads on the test account.
const SUFFIX = Date.now();
const aardvarkName = `Aardvark E2E ${SUFFIX}`;
const zebraName = `Zebra E2E ${SUFFIX}`;
let aardvarkId: string;
let zebraId: string;

async function createSavedSpread(page: Page, name: string): Promise<string> {
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

async function deleteSpreadById(page: Page, id: string) {
  try {
    await page.goto(`/personal/spreads/${id}?mode=view`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete Spread' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await page.waitForURL('**/personal/spreads');
  } catch {
    // Best-effort cleanup; don't fail the suite if the spread is already gone.
  }
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  try {
    aardvarkId = await createSavedSpread(page, aardvarkName);
    zebraId = await createSavedSpread(page, zebraName);
  } finally {
    await context.close();
  }
});

test.afterAll(async ({ browser }) => {
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  try {
    if (aardvarkId) await deleteSpreadById(page, aardvarkId);
    if (zebraId) await deleteSpreadById(page, zebraId);
  } finally {
    await context.close();
  }
});

test.skip(
  'Test 1 — empty state renders when no spreads or drafts exist',
  async () => {
    // Requires a clean account with no spreads or drafts. Run manually against
    // a fresh test user.
  }
);

test('Test 2 — spread cards render with name and card count', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('link', { name: /^Open spread / }).first()).toBeVisible();
  await expect(page.getByText(/\b\d+ cards?\b/).first()).toBeVisible();
});

test('Test 3 — DRAFT badge renders for a localStorage-seeded draft', async ({ page }) => {
  const draftDate = 9_999_999_999_999;
  await page.addInitScript((date) => {
    const draft = {
      name: 'E2E Draft',
      description: '',
      positions: [],
      date,
      numberOfCards: 0,
    };
    localStorage.setItem(`spread-draft-${date}`, JSON.stringify(draft));
  }, draftDate);

  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('DRAFT').first()).toBeVisible();
});

test('Test 4 — clicking a spread card navigates to its view page', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  await page.getByRole('link', { name: `Open spread ${aardvarkName}` }).click();

  await page.waitForURL(/\/personal\/spreads\/[^/?]+/);
  expect(page.url()).toMatch(/\/personal\/spreads\/[^/?]+/);
});

test('Test 5 — search input filters cards by name', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Search spreads').fill(aardvarkName);

  await expect(page.getByRole('link', { name: `Open spread ${aardvarkName}` })).toBeVisible();
  await expect(page.getByRole('link', { name: `Open spread ${zebraName}` })).toHaveCount(0);
});

test('Test 6 — Drafts / Saved / All filters update the URL and visible cards', async ({ page }) => {
  const draftDate = 9_999_999_999_998;
  const draftName = 'E2E Filter Draft';
  // Clear any stale spread-draft-* keys leaked into the shared storageState
  // by previous runs, then seed a single known draft for this test.
  await page.addInitScript(
    ({ date, name }) => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('spread-draft-'))
        .forEach((k) => localStorage.removeItem(k));
      const draft = {
        name,
        description: '',
        positions: [],
        date,
        numberOfCards: 0,
      };
      localStorage.setItem(`spread-draft-${date}`, JSON.stringify(draft));
    },
    { date: draftDate, name: draftName },
  );

  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  // base-ui's Toggle renders as <button aria-pressed>, so the toggle-group
  // items inherit role="button" rather than role="radio". Scope to the group
  // by aria-label to avoid colliding with toolbar buttons.
  const filterGroup = page.getByRole('group', { name: 'Filter spreads by status' });

  // Drafts filter — only the draft card is visible, no saved cards.
  await filterGroup.getByRole('button', { name: 'Drafts' }).click();
  await page.waitForURL(/\?view=drafts/);
  await expect(page.getByText(draftName)).toBeVisible();
  await expect(page.getByRole('link', { name: `Open spread ${aardvarkName}` })).toHaveCount(0);
  await expect(page.getByRole('link', { name: `Open spread ${zebraName}` })).toHaveCount(0);

  // Saved filter — saved cards visible, seeded draft hidden.
  await filterGroup.getByRole('button', { name: 'Saved' }).click();
  await page.waitForURL(/\?view=saved/);
  await expect(page.getByRole('link', { name: `Open spread ${aardvarkName}` })).toBeVisible();
  await expect(page.getByText(draftName)).toHaveCount(0);

  // All filter — view= param removed.
  await filterGroup.getByRole('button', { name: 'All' }).click();
  await page.waitForURL((url) => !url.searchParams.has('view'));
  await expect(page.getByRole('link', { name: `Open spread ${aardvarkName}` })).toBeVisible();
});

test('Test 7 — favorites toggle filters to favorited spreads only', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  // The aardvark card has a single button in its footer (the star toggle).
  const aardvarkCard = page
    .getByRole('link', { name: `Open spread ${aardvarkName}` })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await aardvarkCard.getByRole('button').first().click();

  // Give the toggleFavorite mutation a moment to round-trip before flipping
  // the URL filter so the reactive query has the updated value.
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Show favorites only' }).click();
  await page.waitForURL(/\?fav=1/);

  await expect(page.getByRole('link', { name: `Open spread ${aardvarkName}` })).toBeVisible();
  await expect(page.getByRole('link', { name: `Open spread ${zebraName}` })).toHaveCount(0);

  // Cleanup: unfavorite so subsequent tests see the original state.
  await aardvarkCard.getByRole('button').first().click();
  await page.waitForTimeout(500);
});

test('Test 8 — sort by Name orders cards alphabetically ascending', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  // The menu stays open after a radio item is clicked, so flip both the
  // sort field and direction in a single open session — closing and
  // reopening between clicks races with the menu's animation and detaches
  // the radio item mid-click.
  await page.getByRole('button', { name: /Sort spreads by/ }).click();
  await page.getByRole('menuitemradio', { name: 'Name' }).click();
  await page.waitForURL(/\?.*sort=name/);

  // Default direction is descending — explicitly switch to ascending so
  // "Aardvark E2E ..." precedes "Zebra E2E ..." in the DOM.
  await page.getByRole('menuitemradio', { name: 'Ascending' }).click();
  await page.waitForURL(/\?.*dir=asc/);

  // Close the menu if still open.
  await page.keyboard.press('Escape');

  const labels = await page
    .locator('[aria-label^="Open spread "]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));

  const aardvarkIdx = labels.findIndex((l) => l === `Open spread ${aardvarkName}`);
  const zebraIdx = labels.findIndex((l) => l === `Open spread ${zebraName}`);

  expect(aardvarkIdx).toBeGreaterThanOrEqual(0);
  expect(zebraIdx).toBeGreaterThanOrEqual(0);
  expect(aardvarkIdx).toBeLessThan(zebraIdx);
});

test('Test 9 — deleting a draft removes the DRAFT card after confirmation', async ({ page }) => {
  const draftDate = 9_999_999_999_997;
  const draftName = 'E2E Delete Draft';
  // Clear stale spread-draft-* keys leaked by earlier runs into the shared
  // storageState, then seed exactly the draft this test relies on.
  await page.addInitScript(
    ({ date, name }) => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('spread-draft-'))
        .forEach((k) => localStorage.removeItem(k));
      const draft = {
        name,
        description: '',
        positions: [],
        date,
        numberOfCards: 0,
      };
      localStorage.setItem(`spread-draft-${date}`, JSON.stringify(draft));
    },
    { date: draftDate, name: draftName },
  );

  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  // Anchor on the draft's Open-spread link (same pattern as Test 7) and walk
  // up to the card; the draft footer holds a single button — the delete icon.
  const draftCard = page
    .getByRole('link', { name: `Open spread ${draftName}` })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(draftCard.getByText('DRAFT', { exact: true })).toBeVisible();
  await draftCard.getByRole('button').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Delete draft?')).toBeVisible();

  await dialog.getByRole('button', { name: 'Delete' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('link', { name: `Open spread ${draftName}` })).toHaveCount(0);
});
