import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRegenerateUrl } from "./regenerate-url";
import { buildMatrixAxes } from "./variation-matrix";
import { getPetPreset, PET_PRESETS } from "./pet-presets";
import {
  buildFantasyPresetBlock,
  countFantasyPresetSelections,
  getFantasyShotFramingLine,
  normalizeFantasyPresetOptions,
  resolveFantasyFocus,
  resolveFantasyShotFraming,
} from "prompt-studio-core/src/lib/fantasy-options";
import { getFantasyPreset, FANTASY_PRESETS } from "./fantasy-presets";
import {
  buildRandomFantasySeed,
  fantasyFocusIncludesPeople,
} from "prompt-studio-core/src/lib/fantasy-scene-pools";
import type { PromptHistoryEntry } from "prompt-studio-core/src/hooks/usePromptHistory";

describe("regenerate url", () => {
  it("routes duo history to character page with duo mode", () => {
    const url = buildRegenerateUrl({
      id: "1",
      tool: "duo",
      prompt: "Two cyclists race.",
      hints: "gravel duo race",
      model: "qwen-image-2512",
      timestamp: Date.now(),
    });
    assert.match(url, /^\/character\?/);
    assert.match(url, /mode=duo/);
    assert.match(url, /hints=gravel/);
  });

  it("routes character entries to character page", () => {
    const url = buildRegenerateUrl({
      id: "2",
      tool: "character",
      prompt: "A woman on a rooftop.",
      hints: "young woman, rooftop",
      model: "qwen-image-2512",
      timestamp: Date.now(),
    });
    assert.match(url, /^\/character\?/);
    assert.match(url, /mode=solo/);
  });

  it("routes random scene history to generate with random source", () => {
    const url = buildRegenerateUrl({
      id: "3",
      tool: "randomScene",
      prompt: "A foggy pier at dawn.",
      hints: "noir",
      model: "qwen-image-2512",
      timestamp: Date.now(),
    });
    assert.match(url, /^\/\?/);
    assert.match(url, /source=random/);
    assert.match(url, /hints=noir/);
  });
});

describe("variation matrix", () => {
  it("builds row by column cells", () => {
    const cells = buildMatrixAxes({
      axisRow: "variation",
      axisCol: "location",
      rowCount: 2,
      colCount: 2,
      recentLocations: ["forest", "beach"],
    });
    assert.equal(cells.length, 4);
    assert.ok(cells[0].rowLabel.startsWith("Var "));
    assert.equal(cells[0].colLabel, "forest");
  });
});

describe("regenerate url seed", () => {
  it("includes seed param for reproducible regenerate", () => {
    const url = buildRegenerateUrl({
      id: "3",
      tool: "duo",
      prompt: "Race prompt",
      hints: "gravel duo",
      model: "qwen-image-2512",
      timestamp: Date.now(),
      metadata: { seed: "velodrome banking, wet pavement" },
    });
    assert.match(url, /seed=/);
  });
});

describe("comfyui gallery outputs", () => {

  it("loads pet presets", () => {
    const preset = getPetPreset("golden-retriever-park");
    assert.ok(preset?.hints.includes("golden retriever"));
    assert.ok(PET_PRESETS.length >= 30);
  });

  it("builds fantasy scene seeds and presets", () => {
    const options = normalizeFantasyPresetOptions({
      focus: "environment",
      subgenre: "dark-fantasy",
      settingArchetype: "underdark",
      magicElement: "necrotic-mist",
    });
    assert.equal(countFantasyPresetSelections(options), 4);
    assert.equal(resolveFantasyFocus(options, ""), "environment");
    assert.equal(fantasyFocusIncludesPeople(resolveFantasyFocus(options, "")), false);

    const { seed } = buildRandomFantasySeed(undefined, [], options, 70);
    assert.match(seed, /empty fantasy environment/i);
    assert.match(seed, /underdark|bioluminescent|fungi/i);

    const preset = getFantasyPreset("dragon-lair");
    assert.ok(preset?.hints.includes("dragon"));
    assert.ok(FANTASY_PRESETS.length >= 30);

    const block = buildFantasyPresetBlock(options);
    assert.ok(block?.includes("FANTASY PRESET"));

    assert.equal(resolveFantasyShotFraming("environment", "portrait"), "wide");
    assert.equal(resolveFantasyShotFraming("character", "action"), "action");
    assert.match(
      getFantasyShotFramingLine("full-body"),
      /full-body framing/i,
    );
  });
});

describe("batch lint helpers", () => {
  it("filters blocked batch indexes", async () => {
    const { filterBatchByLintIndexes } = await import("./batch-lint-gate");
    assert.deepEqual(filterBatchByLintIndexes(["a", "b", "c"], [1]), ["a", "c"]);
  });
});

describe("prompt iteration tree", () => {
  it("builds parent child forest", async () => {
    const { buildPromptIterationForest } = await import("./prompt-iteration-tree");
    const forest = buildPromptIterationForest([
      {
        id: "a",
        prompt: "root",
        tool: "character",
        model: "qwen-image-2512",
        timestamp: 1,
      },
      {
        id: "b",
        prompt: "child",
        tool: "character",
        model: "qwen-image-2512",
        timestamp: 2,
        metadata: { parentHistoryId: "a" },
      },
    ] as import("prompt-studio-core/src/hooks/usePromptHistory").PromptHistoryEntry[]);
    assert.equal(forest.length, 1);
    assert.equal(forest[0]?.children.length, 1);
  });
});

describe("preset packs", () => {
  it("round-trips pack json", async () => {
    const { buildPresetPack, parsePresetPack } = await import("./preset-packs");
    const pack = buildPresetPack({
      name: "Night pack",
      presets: [
        {
          id: "p1",
          name: "Neon alley",
          hints: "rain",
          tool: "studio",
          createdAt: 1,
        },
      ],
    });
    const parsed = parsePresetPack(JSON.stringify(pack));
    assert.equal(parsed.name, "Night pack");
    assert.equal(parsed.presets.length, 1);
  });
});

describe("matrix export formats", () => {
  it("exports matrix rows as CSV with escaped prompts", async () => {
    const { exportMatrixCsv } = await import("./matrix-export-formats");
    const csv = exportMatrixCsv([
      {
        rowLabel: "sport",
        colLabel: "lighting",
        prompt: 'cyclist, "golden hour"',
        seed: "123",
      },
    ]);
    assert.match(csv, /^row,column,seed,prompt,error/);
    assert.match(csv, /sport/);
    assert.match(csv, /""golden hour""/);
  });
});

describe("iteration tree export", () => {
  it("serializes parent child forest", async () => {
    const { exportIterationForestJson } = await import("./iteration-tree-export");
    const json = exportIterationForestJson([
      {
        id: "root",
        tool: "character",
        model: "qwen-image-2512",
        prompt: "root prompt",
        hints: "",
        timestamp: 1,
      },
      {
        id: "child",
        tool: "refine",
        model: "qwen-image-2512",
        prompt: "child prompt",
        hints: "",
        timestamp: 2,
        metadata: { parentHistoryId: "root" },
      },
    ] as import("prompt-studio-core/src/hooks/usePromptHistory").PromptHistoryEntry[]);
    assert.match(json, /child prompt/);
    assert.match(json, /"parentId": "root"/);
  });
});

describe("iteration branch diff", () => {
  it("diffs linked history entries", async () => {
    const { diffHistoryEntries, listIterationEntries } = await import("./iteration-branch-diff"
    );
    const entries = [
      {
        id: "root",
        tool: "character",
        model: "qwen-image-2512",
        prompt: "alpha beta gamma",
        hints: "",
        timestamp: 1,
      },
      {
        id: "child",
        tool: "refine",
        model: "qwen-image-2512",
        prompt: "alpha beta delta",
        hints: "",
        timestamp: 2,
        metadata: { parentHistoryId: "root" },
      },
    ] as PromptHistoryEntry[];
    const flat = listIterationEntries(entries);
    assert.equal(flat.length, 2);
    const diff = diffHistoryEntries(flat[0]!, flat[1]!);
    assert.equal(diff.diff.changed, true);
  });
});
