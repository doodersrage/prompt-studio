#!/usr/bin/env node
/**
 * Runs every `*.test.ts` under src/lib through Node's test runner (tsx for TypeScript, module
 * mocks on) — the same way Castcut runs its unit tests, which these came from.
 */
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const collect = dir =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? collect(full) : entry.endsWith('.test.ts') ? [full] : [];
  });
const files = collect(join(ROOT, 'src', 'lib')).sort();
console.log(`Running ${files.length} test files under src/lib.`);
// Secrets the server generates on first start go to a throwaway folder, not the checkout.
const secretsDir = mkdtempSync(join(tmpdir(), 'prompt-studio-test-secrets-'));
const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    '--experimental-test-module-mocks',
    '--test',
    ...process.argv.slice(2),
    ...files.map(file => relative(ROOT, file)),
  ],
  {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CASTCUT_SECRETS_DIR: secretsDir },
  }
);
rmSync(secretsDir, { recursive: true, force: true });
process.exit(result.status ?? 1);
