import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePrompts } from "./prompt-merge";

describe("prompt merge", () => {
  it("merges unique phrases from two prompts", () => {
    const result = mergePrompts("red bike, muddy trail", "red bike, forest dusk");
    assert.match(result.merged.toLowerCase(), /red bike/);
    assert.match(result.merged.toLowerCase(), /forest dusk/);
    assert.equal(result.sources.left, "red bike, muddy trail");
  });
});
