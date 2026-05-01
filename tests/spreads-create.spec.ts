import { test, expect } from './fixtures';
import { routes } from '@/lib/routes';

test('Test 10 — navigates from spreads list to new spread page', async ({ page }) => {
  await page.goto(routes.personal.spreads.root);
  await page.waitForLoadState('networkidle');

  // The list page renders two CTAs whose accessible names differ only by case
  // ("New Spread" topbar action and "New spread" empty-state link).
  await page.getByRole('button', { name: 'New Spread', exact: true }).click();

  await page.waitForURL('**/personal/spreads/new');
  expect(new URL(page.url()).pathname).toBe(routes.personal.spreads.new.root);
});

test('Test 11 — empty canvas prompt visible and Save Spread disabled', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const prompt = page.locator('text=Double-click to place your first position');
  await expect(prompt).toBeVisible();

  const saveButton = page.getByRole('button', { name: 'Save Spread' });
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeDisabled();
});

test('Test 12 — double-click canvas adds a card position', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const prompt = page.locator('text=Double-click to place your first position');
  await expect(prompt).toBeVisible();

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  await expect(prompt).toBeHidden();

  const addPosition = page.getByText('Add Position');
  await expect(addPosition).toBeVisible();

  // Scope to the left panel — the canvas card also renders "Untitled" text.
  const panel = page.getByTestId('spread-settings-panel');
  await expect(panel.getByText('Untitled', { exact: true })).toBeVisible();
});

test('Test 13 — typing in spread name updates the page title', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Spread' })).toBeVisible();

  await page.locator('#spread-name').fill('My Custom Spread');

  await expect(page.getByRole('heading', { level: 1, name: 'My Custom Spread' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Spread' })).toHaveCount(0);
});

test('Test 14 — selecting a tile opens the right panel with name and meaning fields', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  const panel = page.getByTestId('spread-settings-panel');
  await panel.getByText('Untitled', { exact: true }).click();

  await expect(page.locator('#card-name')).toBeVisible();
  await expect(page.locator('#card-description')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Position' })).toBeVisible();
});

test('Test 15 — editing the card name in the right panel updates the tile in the left list', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  const panel = page.getByTestId('spread-settings-panel');
  await panel.getByText('Untitled', { exact: true }).click();

  const cardNameInput = page.locator('#card-name');
  await expect(cardNameInput).toBeVisible();
  await cardNameInput.fill('Past');
  await cardNameInput.blur();

  // The left-panel tile renders the name as a bare text node alongside an
  // absolute-positioned index "1" span, so the tile's full text reads "1Past"
  // and won't match an exact "Past" lookup. A substring match is sufficient.
  await expect(panel.getByText('Past').first()).toBeVisible();
  await expect(panel.getByText('Untitled', { exact: true })).toHaveCount(0);
});

test('Test 16 — deleting a position via the tile delete button removes it after confirmation', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  const panel = page.getByTestId('spread-settings-panel');
  const untitled = panel.getByText('Untitled', { exact: true });
  await expect(untitled).toBeVisible();

  // The "Untitled" span sits two levels below the tile's clickable container
  // (span → CardTileName div → clickable inner div). The inner div holds the
  // delete icon button as its only descendant <button>.
  const tileInner = untitled.locator('xpath=../..');
  await tileInner.hover();
  await tileInner.locator('button').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Remove Position 1?')).toBeVisible();

  await dialog.getByRole('button', { name: 'Remove' }).click();

  await expect(dialog).toBeHidden();
  await expect(panel.getByText('Untitled', { exact: true })).toHaveCount(0);
  await expect(
    page.locator('text=Double-click to place your first position')
  ).toBeVisible();
});

test('Test 17 — saves spread successfully and navigates back to list', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  await page.locator('#spread-name').fill('E2E Test Spread');

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  const saveButton = page.getByRole('button', { name: 'Save Spread' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await page.waitForURL('**/personal/spreads');
  expect(new URL(page.url()).pathname).toBe(routes.personal.spreads.root);

  await expect(page.getByText('Spread created!')).toBeVisible();
});

test('Test 18 — Save as draft persists the spread to localStorage and returns to list', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  await page.locator('#spread-name').fill('Draft Spread');
  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  await page.getByRole('button', { name: 'Discard' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // ConfirmDialog renders the "Save as draft" Link via the Button primitive,
  // which keeps role="button" rather than "link".
  await dialog.getByRole('button', { name: 'Save as draft' }).click();

  await page.waitForURL('**/personal/spreads');
  expect(new URL(page.url()).pathname).toBe(routes.personal.spreads.root);

  const draft = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('spread-draft-'));
    return key ? JSON.parse(localStorage.getItem(key) ?? 'null') : null;
  });

  expect(draft).not.toBeNull();
  expect(draft.name).toBe('Draft Spread');
  expect(draft.numberOfCards).toBeGreaterThanOrEqual(1);

  // Cleanup so subsequent tests don't see stale drafts
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('spread-draft-'))
      .forEach((k) => localStorage.removeItem(k));
  });
});

test('Test 19 — Discard removes the draft and navigates away without saving', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  await page.locator('#spread-name').fill('Will Be Discarded');
  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  await expect
    .poll(async () =>
      page.evaluate(() =>
        Object.keys(localStorage).some((k) => k.startsWith('spread-draft-'))
      )
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Discard' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Discard' }).click();

  await page.waitForURL('**/personal/spreads');
  expect(new URL(page.url()).pathname).toBe(routes.personal.spreads.root);

  const remainingDrafts = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('spread-draft-'))
  );
  expect(remainingDrafts).toHaveLength(0);
});

test('Test 20 — Undo removes an added card and Redo restores it', async ({ page }) => {
  await page.goto(routes.personal.spreads.new.root);
  await page.waitForLoadState('networkidle');

  const prompt = page.locator('text=Double-click to place your first position');
  await expect(prompt).toBeVisible();

  const canvas = page.getByTestId('spread-canvas');
  await canvas.dblclick();

  const panel = page.getByTestId('spread-settings-panel');
  await expect(prompt).toBeHidden();
  await expect(panel.getByText('Untitled', { exact: true })).toBeVisible();

  // The Mod+Z hotkey is registered with `ignoreInputs: true` and proved flaky
  // after the auto-focused card-name input, so click the toolbar buttons
  // directly. Mobile and desktop UndoRedoControls render in mutually-exclusive
  // branches, so getByTestId resolves to a single button at the default
  // (desktop) viewport.
  await page.getByTestId('undo-button').click();

  await expect(panel.getByText('Untitled', { exact: true })).toHaveCount(0);
  await expect(prompt).toBeVisible();

  await page.getByTestId('redo-button').click();

  await expect(prompt).toBeHidden();
  await expect(panel.getByText('Untitled', { exact: true })).toBeVisible();
});
