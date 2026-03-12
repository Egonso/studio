import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const PORT = 3310;
const APP_URL = `http://127.0.0.1:${PORT}`;

function collectServerOutput(child: ReturnType<typeof spawn>) {
  let buffer = '';
  const onData = (chunk: Buffer | string) => {
    buffer += chunk.toString();
  };

  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);

  return {
    getText: () => buffer,
    dispose: () => {
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
    },
  };
}

async function waitForServerOutput(
  child: ReturnType<typeof spawn>,
  text: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for "${text}"`));
    }, timeoutMs);

    let buffer = '';
    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      if (buffer.includes(text)) {
        clearTimeout(timer);
        child.stdout?.off('data', onData);
        child.stderr?.off('data', onData);
        resolve(buffer);
      }
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Dev server exited before ready (code ${code ?? -1})`));
    });
  });
}

async function waitForRootRoute(timeoutMs: number): Promise<{
  status: number;
  html: string;
}> {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = 0;
  let lastHtml = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(APP_URL, {
        headers: {
          Accept: 'text/html',
        },
      });
      const html = await response.text();

      lastStatus = response.status;
      lastHtml = html;

      const looksLikeRootRoute =
        response.status === 200 &&
        (/\/_next\/static\/chunks\/app\/page\.js/i.test(html) ||
          /src\/app\/landingsimple\/page\.tsx/i.test(html) ||
          /KI-Register/i.test(html));

      if (looksLikeRootRoute) {
        return { status: response.status, html };
      }
    } catch {
      // Ignore early connection errors while the dev server is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { status: lastStatus, html: lastHtml };
}

async function stopServer(child: ReturnType<typeof spawn>): Promise<void> {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    child.once('exit', () => resolve(null));
    setTimeout(resolve, 5_000);
  });
}

export async function runRootRouteSmoke() {
  const child = spawn(
    process.execPath,
    ['./node_modules/next/dist/bin/next', 'dev', '-p', String(PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=4096',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const outputCollector = collectServerOutput(child);

  try {
    await waitForServerOutput(child, 'Ready in', 60_000);
    const { status, html } = await waitForRootRoute(30_000);
    const output = outputCollector.getText();

    assert.equal(status, 200);
    assert.ok(
      /\/_next\/static\/chunks\/app\/page\.js/i.test(html) ||
        /src\/app\/landingsimple\/page\.tsx/i.test(html) ||
        /KI-Register/i.test(html),
      'Root route should render the app entry instead of failing during SSR.',
    );
    assert.ok(
      !output.includes('localStorage.getItem is not a function'),
      'Root route must not trigger the SSR localStorage failure.',
    );
    console.log('Root route smoke passed.');
  } finally {
    outputCollector.dispose();
    await stopServer(child);
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runRootRouteSmoke().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
