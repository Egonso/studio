import { config as loadDotEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { generateDraftAssist } from '@/ai/flows/draft-assist-generate';
import { resolveDraftAssistContext } from '@/lib/draft-assist/context-resolver';
import { parseDraftAssistContext, type DraftAssistContext } from '@/lib/draft-assist/types';
import type { RegisterScopeContext } from '@/lib/register-first';

interface RunnerOptions {
  description?: string;
  descriptionFile?: string;
  contextFile?: string;
  registerId?: string;
  workspaceId?: string;
  withContext: boolean;
  json: boolean;
  help: boolean;
}

function loadEnvFiles() {
  loadDotEnv({ path: resolve(process.cwd(), '.env.local') });
  loadDotEnv({ path: resolve(process.cwd(), '.env') });
}

function printHelp() {
  console.log(`Draft Assist Runner

Usage:
  npx tsx scripts/draft-assist-runner.ts --description "..."
  npx tsx scripts/draft-assist-runner.ts --description-file ./notes.txt

Optional context:
  --with-context              Resolve active/first register context if available
  --register-id <id>          Resolve a specific register context
  --workspace-id <id>         Use workspace scope for context lookup
  --context-file <path>       Load a pre-resolved DraftAssistContext JSON file

Output:
  Prints JSON with draft, verifier, questions, and handoff payload.
`);
}

function parseArgs(argv: string[]): RunnerOptions {
  const options: RunnerOptions = {
    withContext: false,
    json: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--description':
        options.description = argv[index + 1];
        index += 1;
        break;
      case '--description-file':
        options.descriptionFile = argv[index + 1];
        index += 1;
        break;
      case '--context-file':
        options.contextFile = argv[index + 1];
        index += 1;
        break;
      case '--register-id':
        options.registerId = argv[index + 1];
        index += 1;
        break;
      case '--workspace-id':
        options.workspaceId = argv[index + 1];
        index += 1;
        break;
      case '--with-context':
        options.withContext = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${value}`);
    }
  }

  return options;
}

function readDescription(options: RunnerOptions): string {
  if (options.description?.trim()) {
    return options.description.trim();
  }

  if (options.descriptionFile) {
    return readFileSync(resolve(process.cwd(), options.descriptionFile), 'utf8').trim();
  }

  throw new Error('A description is required via --description or --description-file.');
}

function readContextFile(contextFile: string): DraftAssistContext {
  const raw = readFileSync(resolve(process.cwd(), contextFile), 'utf8');
  return parseDraftAssistContext(JSON.parse(raw));
}

function buildScopeContext(workspaceId?: string): RegisterScopeContext | null {
  if (!workspaceId?.trim()) {
    return null;
  }

  return {
    kind: 'workspace',
    workspaceId: workspaceId.trim(),
  };
}

async function loadContext(options: RunnerOptions): Promise<{
  context: DraftAssistContext | null;
  source: 'none' | 'file' | 'register';
}> {
  if (options.contextFile) {
    return {
      context: readContextFile(options.contextFile),
      source: 'file',
    };
  }

  if (!options.withContext && !options.registerId) {
    return {
      context: null,
      source: 'none',
    };
  }

  return {
    context: await resolveDraftAssistContext({
      registerId: options.registerId,
      scopeContext: buildScopeContext(options.workspaceId),
    }),
    source: 'register',
  };
}

async function main() {
  loadEnvFiles();

  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const description = readDescription(options);
  const { context, source } = await loadContext(options);
  const result = await generateDraftAssist({
    description,
    context,
  });

  const payload = {
    ok: true,
    description,
    contextSource: source,
    contextLoaded: Boolean(context),
    registerId: context?.registerId ?? null,
    verdict: result.verifier.verdict,
    result,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  console.log(payload);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `${JSON.stringify({ ok: false, error: message }, null, 2)}\n`,
  );
  process.exitCode = 1;
});
