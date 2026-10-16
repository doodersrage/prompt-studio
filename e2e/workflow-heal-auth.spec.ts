import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers/auth';
import { gotoStable } from './helpers/navigation';
import { dismissBlockingOverlays } from './helpers/overlays';

test.describe('Workflow editor', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('workflow editor chrome loads with save and queue controls', async ({ page }) => {
    await page.route('**/api/comfyui/preview**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflowSource: 'editor', preflightIssues: [] }),
      });
    });
    await gotoStable(page, '/workflow-editor');
    await dismissBlockingOverlays(page);
    await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Node graph editor/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save to library/i })).toBeVisible();
    await expect(page.getByTestId('workflow-editor-queue')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Dry-run$/i })).toBeVisible();
    const sampleWorkflow = JSON.stringify({
      '1': {
        class_type: 'CLIPTextEncode',
        inputs: { text: 'e2e dry-run prompt', clip: ['2', 0] },
      },
      '2': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'model.safetensors' },
      },
    });
    const jsonField = page.getByTestId('workflow-editor-json');
    // On a slow CI runner the fill can land before hydration, and the controlled textarea then
    // resets to empty ("JSON parsed to empty."). Re-fill and re-parse until the editor loads it.
    await expect(async () => {
      await jsonField.fill(sampleWorkflow);
      await expect(jsonField).toHaveValue(sampleWorkflow);
      await page.getByRole('button', { name: /Parse JSON/i }).click();
      await expect(page.getByTestId('workflow-editor-status')).toContainText(/Loaded|nodes/i, {
        timeout: 3_000,
      });
    }).toPass({ timeout: 30_000 });
    await page.getByRole('button', { name: /^Dry-run$/i }).click();
    await expect(page.getByTestId('workflow-editor-status')).toContainText(/Dry-run ok/i, {
      timeout: 30_000,
    });
  });

  test('save to library and queue with mocked ComfyUI API', async ({ page }) => {
    await page.route('**/api/comfyui/preview**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflowSource: 'editor', preflightIssues: [] }),
      });
    });
    await page.route('**/api/comfyui', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ promptId: 'e2e-workflow-queue', ok: true }),
      });
    });
    await gotoStable(page, '/workflow-editor');
    await dismissBlockingOverlays(page);
    await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 30_000 });
    const sampleWorkflow = JSON.stringify({
      '1': {
        class_type: 'CLIPTextEncode',
        inputs: { text: 'e2e queue workflow prompt', clip: ['2', 0] },
      },
      '2': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'model.safetensors' },
      },
    });
    const jsonField = page.getByTestId('workflow-editor-json');
    // On a slow CI runner the fill can land before hydration, and the controlled textarea then
    // resets to empty ("JSON parsed to empty."). Re-fill and re-parse until the editor loads it.
    await expect(async () => {
      await jsonField.fill(sampleWorkflow);
      await expect(jsonField).toHaveValue(sampleWorkflow);
      await page.getByRole('button', { name: /Parse JSON/i }).click();
      await expect(page.getByTestId('workflow-editor-status')).toContainText(/Loaded|nodes/i, {
        timeout: 3_000,
      });
    }).toPass({ timeout: 30_000 });
    await page.getByRole('button', { name: /Save to library/i }).click();
    await expect(page.getByTestId('workflow-editor-status')).toContainText(/Saved/i, {
      timeout: 15_000,
    });
    await page.getByTestId('workflow-editor-queue').click();
    await expect(page.getByTestId('workflow-editor-status')).toContainText(/Queued|prompt_id/i, {
      timeout: 30_000,
    });
  });
});
