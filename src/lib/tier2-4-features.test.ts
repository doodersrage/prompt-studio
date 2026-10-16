import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeImagePromptParts, normalizeRefRole } from "./image-prompt-merge";
import { buildProjectBundle } from "./project-bundle";

describe("image prompt merge", () => {
  it("merges roles with strength guidance", () => {
    const merged = mergeImagePromptParts([
      { role: "primary", prompt: "cyclist on gravel road", strength: 1 },
      { role: "style", prompt: "golden hour palette", strength: 0.5 },
    ]);
    assert.match(merged, /Primary subject reference \(influence 100%\)/);
    assert.match(merged, /Style reference.*50%/);
  });

  it("normalizes role aliases", () => {
    assert.equal(normalizeRefRole("Style ref", 1), "style");
    assert.equal(normalizeRefRole("", 0), "primary");
  });
});

describe("project bundle", () => {
  it("filters history and gallery by project id", () => {
    const bundle = buildProjectBundle({
      project: {
        id: "proj-a",
        name: "A",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      history: [
        {
          id: "h1",
          tool: "generate",
          model: "sd15",
          prompt: "one",
          timestamp: Date.now(),
          metadata: { projectId: "proj-a" },
        },
        {
          id: "h2",
          tool: "generate",
          model: "sd15",
          prompt: "two",
          timestamp: Date.now(),
          metadata: { projectId: "proj-b" },
        },
      ],
      gallery: [
        {
          id: "g1",
          promptId: "p1",
          prompt: "one",
          projectId: "proj-a",
          comfyUrl: "",
          status: "completed",
          queuedAt: Date.now(),
          images: [],
        },
      ],
      scenePresets: [],
    });
    assert.equal(bundle.history.length, 1);
    assert.equal(bundle.gallery.length, 1);
    assert.equal(bundle.scenePresets.length, 0);
  });
});
