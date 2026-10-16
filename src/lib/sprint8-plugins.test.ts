import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPluginIframeHostMessage,
  PLUGIN_IFRAME_HOST_CHANNEL,
} from "./plugin-iframe-host";

describe("sprint8 plugin runtime", () => {

  it("accepts plugin:queue and plugin:apply-prompt host messages", () => {
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: "plugin:queue",
        prompt: "a cat",
      }),
      true,
    );
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: "plugin:apply-prompt",
        prompt: "a dog",
        negativePrompt: "blurry",
      }),
      true,
    );
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: "plugin:unknown",
      }),
      false,
    );
  });
});
