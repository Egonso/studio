import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, KeyRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Kit API | KI-Register',
  description:
    'Öffentliche API-Dokumentation für direkte Agent-Kit-Einreichungen ins KI-Register.',
};

const endpoint = 'https://kiregister.com/api/agent-kit/submit';
const githubHref = 'https://github.com/Egonso/ki-register-agent-kit';

const requestExample = `{
  "registerId": "reg_123",
  "manifest": {
    "documentationType": "application",
    "title": "Customer support assistant",
    "purpose": "Draft support answers for human review.",
    "ownerRole": "Support Lead",
    "usageContexts": ["CUSTOMERS"],
    "decisionInfluence": "PREPARATION",
    "systems": [
      { "position": 1, "name": "Zendesk", "providerType": "TOOL" },
      { "position": 2, "name": "Claude", "providerType": "MODEL" }
    ],
    "controls": ["Human approval remains mandatory"]
  }
}`;

const responseExample = `{
  "success": true,
  "registerId": "reg_123",
  "workspaceId": "ws_123",
  "useCaseId": "uc_abc123",
  "title": "Draft support answers for human review.",
  "status": "UNREVIEWED",
  "detailPath": "/my-register/uc_abc123?workspace=ws_123",
  "detailUrl": "https://kiregister.com/my-register/uc_abc123?workspace=ws_123"
}`;

const curlExample = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer akv1.<workspaceId>.<keyId>.<secret>" \\
  -d '{
    "registerId": "reg_123",
    "manifest": {
      "documentationType": "application",
      "title": "Customer support assistant",
      "purpose": "Draft support answers for human review.",
      "ownerRole": "Support Lead",
      "usageContexts": ["CUSTOMERS"],
      "systems": [
        { "position": 1, "name": "Zendesk" },
        { "position": 2, "name": "Claude" }
      ]
    }
  }'`;

function CodeBlock({
  title,
  code,
}: {
  title: string;
  code: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
        <code>{code}</code>
      </pre>
    </section>
  );
}

export default function DevelopersAgentKitPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f5f0_0%,#ffffff_42%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
            aria-label="Zur Hauptseite von KI-Register"
          >
            <Image
              src="/register-logo.png"
              alt="KI-Register"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Developer Docs
              </p>
              <h1 className="text-2xl font-bold text-slate-900">Agent Kit API</h1>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/settings/agent-kit"
              className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <KeyRound className="h-4 w-4" />
              API-Key erstellen
            </Link>
            <a
              href={githubHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Minimal API
            </p>
            <h2 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950">
              Agents document first, then submit directly into KI-Register.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              This API is for the technical team that configures the handoff once.
              Team leads should not need the CLI, the ZIP, or the JSON file. They
              should only see the resulting use case on the KI-Register website.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#endpoint"
                className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Endpoint ansehen
              </a>
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Downloads
              </Link>
            </div>
          </div>

          <section className="rounded-[28px] border border-slate-900 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Direct submit
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  1 Scope
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Choose either a personal register or a real workspace scope and create one
                  personal API key for that scope.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  2 Capture
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  The agent documents the use case, asks for missing facts, and waits for
                  explicit human confirmation.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  3 Submit
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  The confirmed manifest is submitted into KI-Register and the review stays on
                  the website instead of in local files.
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Who this is for
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Codex, Claude Code, OpenClaw, Antigravity, CI pipelines, and shell-based
              automation that should hand confirmed Agent Kit manifests into KI-Register.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Authentication
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Each user creates a personal Agent Kit API key for either a personal register
              or a workspace scope. The key is then passed as a bearer token or `x-api-key`
              header for submissions.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Outcome
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              A successful request creates a real use case entry in the linked register so
              the review surface stays on the website and not in local files.
            </p>
          </article>
        </section>

        <section
          id="endpoint"
          className="mt-10 rounded-2xl border border-slate-900 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Endpoint
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              `POST /api/agent-kit/submit`
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Production endpoint: <span className="font-medium text-slate-950">{endpoint}</span>
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Method</div>
              <p className="mt-2 text-sm text-slate-600">`POST`</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Auth</div>
              <p className="mt-2 text-sm text-slate-600">`Authorization: Bearer akv1...`</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Body</div>
              <p className="mt-2 text-sm text-slate-600">`registerId` plus Agent Kit `manifest`</p>
            </article>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <CodeBlock title="Request Body" code={requestExample} />
          <CodeBlock title="Success Response" code={responseExample} />
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <CodeBlock title="cURL Example" code={curlExample} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Get your key
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Create the key while signed in
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              There is a dedicated signed-in screen for this now. Choose the active personal
              or workspace scope, select the target register, create your key, and copy the
              exact command block for your agent or CI setup.
            </p>
            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">What you configure once</p>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                <li>Choose `Mein Register` or a workspace.</li>
                <li>Select the linked target register.</li>
                <li>Create one personal API key.</li>
                <li>Copy the ready-to-use submit command for your agent.</li>
              </ul>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/settings/agent-kit"
                className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <KeyRound className="h-4 w-4" />
                Zur API-Key-Seite
              </Link>
              <a
                href={githubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                Agent Kit Repo
              </a>
            </div>
          </section>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Notes
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <p className="text-sm leading-7 text-slate-700">
              Validation still happens before submission. The manifest should be reviewed and
              confirmed by a human before it is sent to KI-Register.
            </p>
            <p className="text-sm leading-7 text-slate-700">
              If a key is revoked or the user loses access to the selected scope, new
              submissions with that key are rejected on the server.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
