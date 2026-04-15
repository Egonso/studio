import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, KeyRound } from 'lucide-react';

import { localizeHref } from '@/lib/i18n/localize-href';

interface Props {
  params: Promise<{ locale: string }>;
}

const endpoint = 'https://kiregister.com/api/agent-kit/submit';
const githubHref = 'https://github.com/Egonso/ki-register-agent-kit';

function getAgentKitDocsCopy(locale: string) {
  if (locale === 'de') {
    return {
      appName: 'KI Register',
      metadataTitle: 'Agent Kit API | KI Register',
      metadataDescription:
        'Öffentliche API-Dokumentation für direkte Agent-Kit-Einreichungen ins KI Register.',
      brandLabel: 'Developer Docs',
      pageTitle: 'Agent Kit API',
      createKey: 'API-Key erstellen',
      github: 'GitHub',
      heroKicker: 'Minimal API',
      heroTitle: 'Agenten dokumentieren zuerst und reichen danach direkt ins KI Register ein.',
      heroBody:
        'Diese API ist für technische Teams, die die Übergabe einmal sauber konfigurieren. Teamleads sollten weder CLI noch ZIP oder JSON-Datei brauchen. Sie sollen nur den resultierenden Einsatzfall auf der Website des KI Registers sehen.',
      seeEndpoint: 'Endpoint ansehen',
      downloads: 'Downloads',
      directSubmit: 'Direkte Einreichung',
      steps: [
        {
          title: '1 Scope',
          body:
            'Wählen Sie entweder `Mein Register` oder einen Workspace-Scope und erstellen Sie genau einen scoped Agent-Kit-API-Key für dieses Ziel.',
        },
        {
          title: '2 Dokumentation',
          body:
            'Der Agent dokumentiert den Einsatzfall, fragt fehlende Fakten nach und wartet auf eine explizite menschliche Bestätigung.',
        },
        {
          title: '3 Einreichung',
          body:
            'Der bestätigte Manifest-Eintrag wird ins KI Register übergeben. Die Review bleibt damit auf der Website statt in lokalen Dateien.',
        },
      ],
      cards: [
        {
          title: 'Für wen das gedacht ist',
          body:
            'Codex, Claude Code, OpenClaw, Antigravity, CI-Pipelines und Shell-basierte Automationen, die bestätigte Agent-Kit-Manifeste ins KI Register übergeben sollen.',
        },
        {
          title: 'Authentifizierung',
          body:
            'Jede Person erstellt einen scoped Agent-Kit-API-Key für `Mein Register` oder für einen Workspace. Dieser Key wird danach als Bearer-Token oder `x-api-key`-Header übergeben.',
        },
        {
          title: 'Ergebnis',
          body:
            'Ein erfolgreicher Request erzeugt einen echten Einsatzfall im verknüpften Register, damit die Review-Oberfläche auf der Website bleibt und nicht in lokalen Dateien.',
        },
      ],
      endpointKicker: 'Endpoint',
      endpointIntro: 'Produktiver Endpoint:',
      method: 'Methode',
      auth: 'Auth',
      body: 'Body',
      requestBody: 'Request Body',
      successResponse: 'Success Response',
      curlTitle: 'cURL Beispiel',
      getKey: 'Key holen',
      getKeyTitle: 'Den Key im eingeloggten Bereich erstellen',
      getKeyBody:
        'Dafür gibt es jetzt eine eigene eingeloggte Oberfläche. Wählen Sie den aktiven Scope, das Ziel-Register, erstellen Sie den scoped Key und kopieren Sie danach den exakten Befehlsblock für Agent oder CI.',
      configureOnce: 'Einmal konfigurieren',
      configureOnceSteps: [
        '`Mein Register` oder einen Workspace-Scope wählen.',
        'Das verknüpfte Ziel-Register auswählen.',
        'Einen scoped Agent-Kit-API-Key erstellen.',
        'Den einsatzbereiten Submit-Befehl für den Agenten kopieren.',
      ],
      goToKeyPage: 'Zur API-Key-Seite',
      repo: 'Agent-Kit-Repo',
      notes: 'Hinweise',
      noteLeft:
        'Die Validierung passiert weiterhin vor der Einreichung. Das Manifest sollte vor dem Senden ins KI Register durch einen Menschen geprüft und bestätigt werden.',
      noteRight:
        'Wird ein Key widerrufen oder verliert ein Nutzer den Zugriff auf den gewählten Scope, lehnt der Server neue Einreichungen mit diesem Key ab.',
      requestExample: `{
  "registerId": "reg_123",
  "manifest": {
    "documentationType": "application",
    "title": "Support-Assistent für den Kundenservice",
    "purpose": "Antwortentwürfe für den menschlichen Review vorbereiten.",
    "ownerRole": "Support Lead",
    "usageContexts": ["CUSTOMERS"],
    "decisionInfluence": "PREPARATION",
    "systems": [
      { "position": 1, "name": "Zendesk", "providerType": "TOOL" },
      { "position": 2, "name": "Claude", "providerType": "MODEL" }
    ],
    "controls": ["Menschliche Freigabe bleibt verpflichtend"]
  }
}`,
      responseExample: `{
  "success": true,
  "registerId": "reg_123",
  "workspaceId": "ws_123",
  "useCaseId": "uc_abc123",
  "title": "Support-Assistent für den Kundenservice",
  "status": "UNREVIEWED",
  "detailPath": "/my-register/uc_abc123?workspace=ws_123",
  "detailUrl": "https://kiregister.com/my-register/uc_abc123?workspace=ws_123"
}`,
      curlExample: `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer akv1.<scopeId>.<keyId>.<secret>" \\
  -d '{
    "registerId": "reg_123",
    "manifest": {
      "documentationType": "application",
      "title": "Support-Assistent für den Kundenservice",
      "purpose": "Antwortentwürfe für den menschlichen Review vorbereiten.",
      "ownerRole": "Support Lead",
      "usageContexts": ["CUSTOMERS"],
      "systems": [
        { "position": 1, "name": "Zendesk" },
        { "position": 2, "name": "Claude" }
      ]
    }
  }'`,
    };
  }

  return {
    appName: 'AI Registry',
    metadataTitle: 'Agent Kit API | AI Registry',
    metadataDescription:
      'Public API documentation for direct Agent Kit submissions into AI Registry.',
    brandLabel: 'Developer Docs',
    pageTitle: 'Agent Kit API',
    createKey: 'Create API key',
    github: 'GitHub',
    heroKicker: 'Minimal API',
    heroTitle: 'Agents document first, then submit directly into AI Registry.',
    heroBody:
      'This API is for technical teams that want to configure the handoff once in a clean way. Team leads should not need the CLI, the ZIP or the JSON file. They should only see the resulting use case on the AI Registry website.',
    seeEndpoint: 'See endpoint',
    downloads: 'Downloads',
    directSubmit: 'Direct submit',
    steps: [
      {
        title: '1 Scope',
        body:
          'Choose either `My Register` or a workspace scope and create exactly one scoped Agent Kit API key for that target.',
      },
      {
        title: '2 Capture',
        body:
          'The agent documents the use case, asks for missing facts and waits for explicit human confirmation.',
      },
      {
        title: '3 Submit',
        body:
          'The confirmed manifest is submitted into AI Registry, so the review stays on the website instead of in local files.',
      },
    ],
    cards: [
      {
        title: 'Who this is for',
        body:
          'Codex, Claude Code, OpenClaw, Antigravity, CI pipelines and shell-based automations that should hand confirmed Agent Kit manifests into AI Registry.',
      },
      {
        title: 'Authentication',
        body:
          'Each person creates one scoped Agent Kit API key for `My Register` or for a workspace. The key is then passed as a bearer token or `x-api-key` header.',
      },
      {
        title: 'Outcome',
        body:
          'A successful request creates a real use case entry in the linked register so the review surface stays on the website and not in local files.',
      },
    ],
    endpointKicker: 'Endpoint',
    endpointIntro: 'Production endpoint:',
    method: 'Method',
    auth: 'Auth',
    body: 'Body',
    requestBody: 'Request body',
    successResponse: 'Success response',
      curlTitle: 'cURL example',
    getKey: 'Get your key',
    getKeyTitle: 'Create the key while signed in',
    getKeyBody:
      'There is now a dedicated signed-in screen for this. Choose the active scope, select the target register, create the scoped key and copy the exact command block for your agent or CI setup.',
    configureOnce: 'Configure once',
    configureOnceSteps: [
      'Choose `My Register` or a workspace scope.',
      'Select the linked target register.',
      'Create one scoped Agent Kit API key.',
      'Copy the ready-to-use submit command for your agent.',
    ],
    goToKeyPage: 'Go to API key page',
    repo: 'Agent Kit repo',
    notes: 'Notes',
    noteLeft:
      'Validation still happens before submission. The manifest should be reviewed and confirmed by a human before it is sent into AI Registry.',
    noteRight:
      'If a key is revoked or a user loses access to the selected scope, the server rejects new submissions with that key.',
    requestExample: `{
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
}`,
    responseExample: `{
  "success": true,
  "registerId": "reg_123",
  "workspaceId": "ws_123",
  "useCaseId": "uc_abc123",
  "title": "Customer support assistant",
  "status": "UNREVIEWED",
  "detailPath": "/my-register/uc_abc123?workspace=ws_123",
  "detailUrl": "https://kiregister.com/my-register/uc_abc123?workspace=ws_123"
}`,
    curlExample: `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer akv1.<scopeId>.<keyId>.<secret>" \\
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
  }'`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = getAgentKitDocsCopy(locale);

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

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

export default async function DevelopersAgentKitPage({ params }: Props) {
  const { locale } = await params;
  const copy = getAgentKitDocsCopy(locale);
  const homeHref = localizeHref(locale, '/');
  const settingsHref = localizeHref(locale, '/settings/agent-kit');
  const downloadsHref = localizeHref(locale, '/downloads');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f5f0_0%,#ffffff_42%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <Link
            href={homeHref}
            className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
            aria-label={copy.appName}
          >
            <Image
              src="/register-logo.png"
              alt={copy.appName}
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {copy.brandLabel}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">{copy.pageTitle}</h1>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={settingsHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <KeyRound className="h-4 w-4" />
              {copy.createKey}
            </Link>
            <a
              href={githubHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              {copy.github}
            </a>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {copy.heroKicker}
            </p>
            <h2 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950">
              {copy.heroTitle}
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">{copy.heroBody}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#endpoint"
                className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {copy.seeEndpoint}
              </a>
              <Link
                href={downloadsHref}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {copy.downloads}
              </Link>
            </div>
          </div>

          <section className="rounded-[28px] border border-slate-900 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {copy.directSubmit}
            </p>
            <div className="mt-5 space-y-4">
              {copy.steps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {copy.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {card.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{card.body}</p>
            </article>
          ))}
        </section>

        <section
          id="endpoint"
          className="mt-10 rounded-2xl border border-slate-900 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {copy.endpointKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              `POST /api/agent-kit/submit`
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {copy.endpointIntro}{' '}
              <span className="font-medium text-slate-950">{endpoint}</span>
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">{copy.method}</div>
              <p className="mt-2 text-sm text-slate-600">`POST`</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">{copy.auth}</div>
              <p className="mt-2 text-sm text-slate-600">`Authorization: Bearer akv1...`</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">{copy.body}</div>
              <p className="mt-2 text-sm text-slate-600">`registerId` plus Agent Kit `manifest`</p>
            </article>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <CodeBlock title={copy.requestBody} code={copy.requestExample} />
          <CodeBlock title={copy.successResponse} code={copy.responseExample} />
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <CodeBlock title={copy.curlTitle} code={copy.curlExample} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {copy.getKey}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {copy.getKeyTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{copy.getKeyBody}</p>
            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">{copy.configureOnce}</p>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {copy.configureOnceSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={settingsHref}
                className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <KeyRound className="h-4 w-4" />
                {copy.goToKeyPage}
              </Link>
              <a
                href={githubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                {copy.repo}
              </a>
            </div>
          </section>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {copy.notes}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <p className="text-sm leading-7 text-slate-700">{copy.noteLeft}</p>
            <p className="text-sm leading-7 text-slate-700">{copy.noteRight}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
