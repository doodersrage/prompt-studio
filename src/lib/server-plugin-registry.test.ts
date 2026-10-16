import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { deflateRawSync } from 'node:zlib';
import { isPluginIframeHostMessage, PLUGIN_IFRAME_HOST_CHANNEL } from './plugin-iframe-host';

function buildStoreZip(files: Array<{ path: string; data: Buffer }>): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.path, 'utf8');
    const compressed = deflateRawSync(file.data);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    parts.push(local, compressed);

    const cen = Buffer.alloc(46 + nameBuf.length);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(0, 16);
    cen.writeUInt32LE(compressed.length, 20);
    cen.writeUInt32LE(file.data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    nameBuf.copy(cen, 46);
    central.push(cen);
    offset += local.length + compressed.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, centralBuf, end]);
}

describe('phase6 server plugins', () => {
  const previousDataDir = process.env.PROMPT_DATA_DIR;
  const previousSecret = process.env.PROMPT_PLUGIN_HMAC_SECRET;
  let tempDir = '';

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-plugins-'));
    process.env.PROMPT_DATA_DIR = tempDir;
    delete process.env.PROMPT_PLUGIN_HMAC_SECRET;
  });

  after(() => {
    if (previousDataDir) process.env.PROMPT_DATA_DIR = previousDataDir;
    else delete process.env.PROMPT_DATA_DIR;
    if (previousSecret) process.env.PROMPT_PLUGIN_HMAC_SECRET = previousSecret;
    else delete process.env.PROMPT_PLUGIN_HMAC_SECRET;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('accepts richer iframe host inbound types', () => {
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: 'plugin:apply-lora-stack',
        loraIds: ['a'],
      }),
      true
    );
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: 'plugin:patch-workflow-tokens',
        tokens: [{ token: 'X', value: '1' }],
      }),
      true
    );
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: 'plugin:write-gallery-tag',
        tag: 'demo',
      }),
      true
    );
    assert.equal(
      isPluginIframeHostMessage({
        channel: PLUGIN_IFRAME_HOST_CHANNEL,
        type: 'plugin:apply-engine',
        engine: 'comfyui',
      }),
      true
    );
  });
});
