import type { NextConfig } from 'next';
// The shared Next config from the core package (CommonJS, so a TypeScript config can require it).
import baseConfig from 'prompt-studio-core/next.config.base.cjs';

/** Paths in the shared config are relative to the app root; the core's source is in node_modules. */
const config: NextConfig = {
  ...baseConfig,
  // The core ships TypeScript source.
  transpilePackages: ['prompt-studio-core'],
  env: { ...baseConfig.env, NEXT_PUBLIC_APP_PROFILE: 'classic' },
};

export default config;
