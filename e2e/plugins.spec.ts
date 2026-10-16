import { test, expect, type Page } from '@playwright/test';
import { seedSettingsCacheOnNextLoad } from './helpers/idb';
import { gotoStable } from './helpers/navigation';
import { dismissBlockingOverlays } from './helpers/overlays';

function seedFirstFilmDone(page: Page) {
  return page.addInitScript(() => {
    window.localStorage.setItem(
      'comfy-play-metrics-v1',
      JSON.stringify({
        version: 1,
        firstFilmCutAt: Date.now(),
      })
    );
  });
}

async function expandFittingMoreMenu(page: Page) {
  const details = page.locator('details').filter({ has: page.getByTestId('fitting-plan-day') });
  await details.locator('summary').click();
}

async function seedStoryMidFlow(
  page: Page,
  id: string,
  /** Extra Story settings for one test (a photo story, a first scene with a still prompt). */
  roleplay: Record<string, unknown> = {},
  firstBeat: Record<string, unknown> = {}
) {
  const thumb = '/wardrobe-thumbs/outfit-cropped-sage-slip-dress.webp';
  await page.addInitScript(castId => {
    window.localStorage.setItem(
      'comfy-prompt-characters-v1',
      JSON.stringify({
        version: 1,
        characters: [{ id: castId, name: 'Story Mid', version: 1, updatedAt: Date.now() }],
        removedIds: [],
      })
    );
    window.localStorage.setItem(
      'comfy-play-metrics-v1',
      JSON.stringify({ version: 1, firstFilmCutAt: Date.now() })
    );
  }, id);
  await seedSettingsCacheOnNextLoad(page, {
    shared: { activeCharacterId: id },
    // The Cast goes into IndexedDB as well as the localStorage mirror above: with the mirror
    // alone, a second page in the same test could come up with an empty Cast list (the phone
    // Story page then says "No Cast lead").
    characters: {
      version: 1,
      characters: [{ id, name: 'Story Mid', version: 1, updatedAt: Date.now() }],
      removedIds: [],
    },
    tools: {
      roleplay: {
        activeSessionId: `cast-${id}`,
        characterName: 'Story Mid',
        bio: { name: 'Story Mid', look: 'green raincoat', personality: 'curious' },
        story: [
          {
            id: 'b1',
            at: Date.now() - 2000,
            kind: 'plot',
            title: 'The letter',
            blurb: 'A letter under the door.',
            stillStatus: 'completed',
            imageUrl: thumb,
            ...firstBeat,
          },
          {
            id: 'b2',
            at: Date.now() - 1000,
            kind: 'plot',
            title: 'The station',
            blurb: 'The last train north.',
            stillStatus: 'running',
          },
        ],
        ...roleplay,
      },
    },
  });
}

/** A phone Story with a plate (writing a bible or a still needs one there). */
const PHONE_STORY_PLATE = {
  isolateSubject: false,
  referenceImageUrl: '/wardrobe-thumbs/outfit-cropped-sage-slip-dress.webp',
  referenceImageFilename: 'e2e-story-plate.webp',
};

test('plugins page separates runtime plugins from bookmarks', async ({ page }) => {
  await gotoStable(page, '/plugins');
  await dismissBlockingOverlays(page);
  await expect(page.getByRole('heading', { name: /^Plugins$/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('heading', { name: /^Runtime plugins$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Sidebar bookmarks$/i })).toBeVisible();
  const advanced = page.locator('summary', { hasText: /Advanced: manage bookmarks/i });
  await expect(advanced).toBeVisible();
  await advanced.click();
  await expect(page.getByRole('heading', { name: /Add custom bookmark/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Custom bookmarks \(JSON\)/i })).toBeVisible();
});

async function installFakeMediaRecorder(page: Page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      state = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      static isTypeSupported() {
        return true;
      }
      start() {
        this.state = 'recording';
        queueMicrotask(() => {
          this.ondataavailable?.({
            data: new Blob([new Uint8Array([0, 0, 0, 1])], { type: 'video/webm' }),
          });
        });
      }
      stop() {
        this.state = 'inactive';
        queueMicrotask(() => this.onstop?.());
      }
      requestData() {}
    }
    // @ts-expect-error test shim
    window.MediaRecorder = FakeMediaRecorder;
    HTMLCanvasElement.prototype.captureStream = function captureStream() {
      return {
        getTracks: () => [{ stop() {}, kind: 'video', enabled: true }],
      } as unknown as MediaStream;
    };
  });
}

/** Report Intimate as switched on (PROMPT_NSFW_GENERATOR_ENABLED) in the health answer. */
async function reportIntimateOn(page: Page) {
  await page.route('**/api/health', async route => {
    const response = await route.fetch().catch(() => null);
    const body = (response ? await response.json().catch(() => ({})) : {}) as Record<
      string,
      unknown
    >;
    await route.fulfill({
      json: {
        ...body,
        serverEnv: {
          groups: [
            {
              fields: [{ key: 'PROMPT_NSFW_GENERATOR_ENABLED', value: 'true' }],
            },
          ],
        },
      },
    });
  });
}

/** Two finished stub jobs in the gallery (both takes), their images served by a stub view. */
async function seedTwoTakeJobs(page: Page, characterId: string) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.route('**/api/comfyui/view**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: png })
  );
  await page.addInitScript(owner => {
    const now = Date.now();
    const job = (promptId: string, filename: string) => ({
      id: `g-${promptId}`,
      promptId,
      prompt: 'two takes',
      model: 'qwen-image-2512',
      tool: 'day',
      queuedAt: now,
      completedAt: now,
      status: 'completed',
      characterId: owner,
      comfyUrl: 'http://127.0.0.1:8188',
      images: [{ filename, subfolder: '', type: 'output' }],
    });
    window.localStorage.setItem(
      'comfyui-gallery-v1',
      JSON.stringify([job('e2e-take-a', 'e2e-take-a.png'), job('e2e-take-b', 'e2e-take-b.png')])
    );
  }, characterId);
}

/**
 * Stub ComfyUI for a Day queue: every queued job gets the next prompt id, uploads are accepted,
 * pictures come back as a 1×1 PNG and object_info is unavailable (plain graphs). Returns the
 * queued job bodies.
 */
async function stubComfyQueue(page: Page, ids: string[]) {
  const queued: Array<Record<string, unknown>> = [];
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  // The context, not the page: some fetches (an upload's image read) come from a worker.
  await page.context().route(/\/api\/comfyui(?:\/|\?|$)/, async route => {
    const request = route.request();
    let path = request.url();
    try {
      path = new URL(request.url()).pathname.replace(/\/$/, '');
    } catch {
      // keep the raw url
    }
    if (request.method() === 'POST' && path === '/api/comfyui') {
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      queued.push(body);
      const promptId = ids[queued.length - 1] ?? `e2e-job-${queued.length}`;
      await route.fulfill({
        json: { ok: true, promptId, comfyUrl: 'http://127.0.0.1:8188' },
      });
      return;
    }
    if (path === '/api/comfyui/upload') {
      await route.fulfill({ json: { name: `e2e-upload-${Date.now()}.png`, subfolder: '', type: 'input' } });
      return;
    }
    if (path.startsWith('/api/comfyui/view')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: png });
      return;
    }
    if (path === '/api/comfyui/preview') {
      await route.fulfill({
        json: {
          ok: true,
          workflowSource: 'minimal',
          replacements: { positive: 1, negative: 0, params: {} },
          workflowJson: JSON.stringify({
            '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'model.safetensors' } },
          }),
        },
      });
      return;
    }
    if (path.startsWith('/api/comfyui/object-info')) {
      await route.fulfill({ status: 502, json: { error: 'e2e: no ComfyUI' } });
      return;
    }
    await route.continue();
  });
  return queued;
}

/** A Cast with two looks (Studio, active; Beach) for the Day-wide Look & clothing tests. */
function dayScopeCast() {
  return {
    version: 1,
    characters: [
      {
        id: 'e2e-day-scope',
        name: 'Juno',
        version: 1,
        updatedAt: Date.now(),
        activeLookId: 'e2e-scope-look-a',
        ipAdapter: { imageFilename: 'e2e-scope-look-a.png', imageUrl: '/icon.svg' },
        lockedWardrobeId: 'outfit-relaxed-fit-lavender-slip-dress',
        looks: [
          {
            id: 'e2e-scope-look-a',
            name: 'Studio',
            createdAt: 2,
            ipAdapter: { imageFilename: 'e2e-scope-look-a.png', imageUrl: '/icon.svg' },
            lockedWardrobeId: 'outfit-relaxed-fit-lavender-slip-dress',
          },
          {
            id: 'e2e-scope-look-b',
            name: 'Beach',
            createdAt: 1,
            ipAdapter: { imageFilename: 'e2e-scope-look-b.png', imageUrl: '/icon.svg' },
            lockedWardrobeId: 'outfit-denim-jacket',
          },
        ],
      },
    ],
    removedIds: [],
  };
}

const DAY_SCOPE_SHARED = {
  activeCharacterId: 'e2e-day-scope',
  activeLookId: 'e2e-scope-look-a',
  lockedWardrobeId: 'outfit-relaxed-fit-lavender-slip-dress',
};

// ── The loop past a cut: Day from an idea, Tomorrow, Story opening with the Day ──────────────

const LOOP_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const LOOP_BEATS = [
  { slotId: 'morning', beat: 'sitting on the ferry with a coffee, watching the river', setting: 'river ferry deck' },
  { slotId: 'afternoon', beat: 'walking through the flower market holding tulips', setting: 'covered market hall' },
  { slotId: 'evening', beat: 'leaning on the bridge rail at sunset, smiling', setting: 'old stone bridge' },
  { slotId: 'night', beat: 'sitting on the windowsill with a book', setting: 'lamp-lit attic room' },
];

async function stubDayPremise(page: Page): Promise<{ bodies: Array<Record<string, unknown>> }> {
  const bodies: Array<Record<string, unknown>> = [];
  await page.route('**/api/day-premise', async route => {
    bodies.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ beats: LOOP_BEATS }) });
  });
  // No ComfyUI: queueing fails fast instead of waiting on a real server.
  await page.route('**/api/comfyui', route =>
    route.request().method() === 'POST' ? route.fulfill({ status: 503, body: '{}' }) : route.continue()
  );
  return { bodies };
}
