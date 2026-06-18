import { spawnSync } from 'node:child_process';

const FIX_MODE = process.argv.includes('--fix');
const ALLOWED_PREFIXES = ['functions/lib/'];

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: options.encoding ?? 'utf8',
    input: options.input,
    stdio: options.stdio ?? 'pipe',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status ?? 1);
  }

  return result.stdout ?? '';
}

function parseNullSeparated(output) {
  return output.split('\0').filter(Boolean);
}

function isAllowed(pathname) {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const trackedIgnored = parseNullSeparated(
  runGit(['ls-files', '-ci', '--exclude-standard', '-z']),
);
const unexpected = trackedIgnored.filter((pathname) => !isAllowed(pathname));
const allowed = trackedIgnored.length - unexpected.length;

if (unexpected.length === 0) {
  console.log('No unexpected tracked ignored files found.');
  if (allowed > 0) {
    console.log(
      `Allowed legacy tracked ignored files remain: ${allowed} under ${ALLOWED_PREFIXES.join(', ')}.`,
    );
  }
  process.exit(0);
}

console.error(
  `Found ${unexpected.length} tracked file(s) that are ignored by .gitignore:`,
);
for (const pathname of unexpected.slice(0, 40)) {
  console.error(`- ${pathname}`);
}

if (unexpected.length > 40) {
  console.error(`... and ${unexpected.length - 40} more.`);
}

if (!FIX_MODE) {
  console.error(
    '\nRun `npm run hygiene:tracked-ignored:fix` to remove these paths from the Git index.',
  );
  process.exit(1);
}

runGit(
  ['rm', '-r', '--cached', '--quiet', '--pathspec-from-file=-', '--pathspec-file-nul'],
  {
    input: `${unexpected.join('\0')}\0`,
    stdio: ['pipe', 'inherit', 'inherit'],
  },
);

console.log(
  `Removed ${unexpected.length} ignored path(s) from the Git index. Review and commit the result.`,
);
