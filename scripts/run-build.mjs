import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

function removeIfPresent(relativePath) {
  const targetPath = path.join(ROOT_DIR, relativePath);
  if (!existsSync(targetPath)) {
    return;
  }

  rmSync(targetPath, { recursive: true, force: true });
}

removeIfPresent('.next');

const result = spawnSync(
  'node',
  [
    '--max-old-space-size=6144',
    './node_modules/next/dist/bin/next',
    'build',
  ],
  {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
