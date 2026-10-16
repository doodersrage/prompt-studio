import { test, expect } from '@playwright/test';
import { gotoStable, } from './helpers/navigation';

test('controlnet page loads', async ({ page }) => {
  await gotoStable(page, '/controlnet');
  await expect(page.getByRole('heading', { name: /^ControlNet$/i })).toBeVisible();
});

test('studio analytics tab loads', async ({ page }) => {
  await gotoStable(page, '/studio');
  const analyticsTab = page.getByRole('button', { name: 'Analytics', exact: true });
  await expect(analyticsTab).toBeVisible({ timeout: 60_000 });
  await analyticsTab.click();
  await expect(page.getByRole('heading', { name: /Gallery rating analytics/i })).toBeVisible();
});

// Prompt Studio's own pages (src/studio-app).
const ADDITIONAL_ROUTES: Array<{
  path: string;
  heading: RegExp;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}> = [
  { path: '/background', heading: /^Background$/i },
  { path: '/fantasy', heading: /^Fantasy$/i },
  { path: '/pet', heading: /^Pet$/i },
  { path: '/format', heading: /Format for your model/i },
  { path: '/prompt', heading: /Prompt Editor/i },
  { path: '/negative', heading: /^Negative$/i },
  { path: '/lint', heading: /^Lint$/i },
  { path: '/topics', heading: /^Topics$/i },
  { path: '/variations', heading: /^Variations$/i },
  { path: '/logo', heading: /^Logo$/i },
  { path: '/image-prompt', heading: /Image → Prompt/i },
  { path: '/plugins', heading: /^Plugins$/i },
  { path: '/studio', heading: /^Studio$/i, level: 1 as const },
];

for (const route of ADDITIONAL_ROUTES) {
  test(`${route.path} loads`, async ({ page }) => {
    await gotoStable(page, route.path);
    await expect(
      page.getByRole('heading', { name: route.heading, level: route.level })
    ).toBeVisible({
      timeout: 60_000,
    });
  });
}
