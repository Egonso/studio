import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const LOCAL_TSX_BIN = path.join(
  ROOT_DIR,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

function ensureTmpDir() {
  const configuredTmp = process.env.TMPDIR?.trim();
  if (configuredTmp) {
    return configuredTmp;
  }

  const repoTmp = path.join(ROOT_DIR, '.tmp');
  mkdirSync(repoTmp, { recursive: true });
  process.env.TMPDIR = `${repoTmp}${path.sep}`;
  return process.env.TMPDIR;
}

function cleanupTsxTmpDirs() {
  const tmpDir = ensureTmpDir() || os.tmpdir();
  if (!existsSync(tmpDir)) {
    return;
  }

  for (const entry of readdirSync(tmpDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^tsx-/.test(entry.name)) {
      continue;
    }

    rmSync(path.join(tmpDir, entry.name), { recursive: true, force: true });
  }
}

function collectFiles(dir, matcher, result = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectFiles(fullPath, matcher, result);
      continue;
    }

    if (matcher(fullPath)) {
      result.push(path.relative(ROOT_DIR, fullPath));
    }
  }

  return result;
}

function runCommand(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=6144',
      TMPDIR: ensureTmpDir(),
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

cleanupTsxTmpDirs();

const unitTestFiles = collectFiles(SRC_DIR, (filePath) =>
  /\.test\.tsx?$/.test(filePath),
).sort();

const smokeFiles = collectFiles(SRC_DIR, (filePath) =>
  /\.smoke\.tsx?$/.test(filePath),
).sort();

if (unitTestFiles.length > 0) {
  runCommand('Running unit and source tests', LOCAL_TSX_BIN, [
    '--test',
    ...unitTestFiles,
  ]);
}

for (const smokeFile of smokeFiles) {
  runCommand(`Running smoke: ${smokeFile}`, LOCAL_TSX_BIN, [smokeFile]);
}

console.log('\nAll tests completed.');
