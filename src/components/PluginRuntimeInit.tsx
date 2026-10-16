'use client';

import { useEffect } from 'react';
import { registerPluginPresetCacheListeners } from 'prompt-studio-core/src/lib/plugin-preset-catalog';

/** Hydrates plugin preset catalogs and listens for manifest updates. */
export default function PluginRuntimeInit() {
  useEffect(() => registerPluginPresetCacheListeners(), []);
  return null;
}
