import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Download, ShieldCheck } from 'lucide-react';

import { isCoverageAssistPilotEnabled } from '@/lib/coverage-assist/feature-gate';
import { localizeHref } from '@/lib/i18n/localize-href';
import { registerFirstFlags } from '@/lib/register-first/flags';

interface Props {
  params: Promise<{ locale: string }>;
}

const coverageAssistPilotEnabled = isCoverageAssistPilotEnabled(registerFirstFlags);
const agentKitGithubHref = 'https://github.com/Egonso/ki-register-agent-kit';

function getDownloadsCopy(locale: string) {
  if (locale === 'de') {
    return {
      appName: 'KI Register',
      metadataTitle: 'Downloads | KI Register',
      metadataDescription:
        'Chrome Plugin, macOS Menüleisten-App und Agent Kit für KI Register herunterladen.',
      headerLabel: 'KI Register',
      pageTitle: 'Downloads',
      backHome: 'Zur Startseite',
      infoNote:
        'Beide Downloads öffnen die bestehende Quick-Capture-Maske des KI Registers. Inhalte und Governance bleiben im gleichen Register-Standard auf kiregister.com.',
      overviewLabel: 'Kurze Übersicht',
      overviewTitle: 'Downloads für Quick Capture',
      installation: 'Installation',
      chromeTitle: 'Chrome Plugin',
      chromeSubtitle:
        'Quick Capture direkt aus der Browser-Toolbar, inklusive Shortcut, Kontextmenü und optionalem Coverage Assist.',
      chromeDownload: 'Chrome Plugin herunterladen',
      chromeSteps: [
        'Chrome öffnen und `chrome://extensions` aufrufen.',
        'Rechts oben den Entwicklermodus aktivieren.',
        'Die Datei `ki-register-quick-capture-chrome.zip` entpacken.',
        'Auf "Entpackte Erweiterung laden" klicken und den entpackten Ordner auswählen.',
        'Die Extension anheften und Quick Capture über das Symbol im Mini-Fenster öffnen.',
        ...(coverageAssistPilotEnabled
          ? [
              'Coverage Assist ist optional: Der lokale Host-Match kann im Plugin pro Gerät aktiviert oder deaktiviert werden.',
            ]
          : []),
        'Keine Domain-Einstellung nötig: Die Extension nutzt standardmäßig `kiregister.com`.',
      ],
      macTitle: 'Mac Menüleisten-App',
      macSubtitle:
        'Native macOS App: öffnet Quick Capture aus der Menüleiste oben neben WLAN und Batterie.',
      macDownload: 'Mac App herunterladen',
      macSteps: [
        'Die Datei `ki-register-menubar-macos.zip` entpacken.',
        '`KI-Register-MenuBar.app` nach Programme ziehen.',
        'Die App beim ersten Start per Rechtsklick öffnen.',
        'Falls macOS blockiert: Systemeinstellungen -> Datenschutz & Sicherheit -> Trotzdem öffnen.',
        'Falls weiterhin blockiert: `xattr -dr com.apple.quarantine /Applications/KI-Register-MenuBar.app`',
        'Nach dem Start erscheint das Symbol oben in der Menüleiste neben WLAN und Batterie.',
      ],
      coverageCards: [
        {
          title: 'Coverage Assist',
          body:
            'Das Chrome Plugin kann optional bekannte KI-Hosts lokal auf dem aktuellen Tab erkennen und den Einstieg in Quick Capture vorbereiten.',
        },
        {
          title: 'Vertrauensgrenze',
          body:
            'Es gibt keine automatische Speicherung. Der eigentliche Einsatzfall wird erst im Register von Ihnen bestätigt oder angepasst.',
        },
        {
          title: 'Lokal und abschaltbar',
          body:
            'Coverage Assist arbeitet mit lokalem Host-Match, speichert keine Browser-History und kann im Plugin jederzeit wieder deaktiviert werden.',
        },
      ],
      agentKitKicker: 'Agent Kit',
      agentKitTitle: 'Nutzung',
      agentKitBody:
        'Hier finden technische Teams die kurze Einführung ins Agent Kit. Das ist kein normaler Endnutzer-Download, sondern ein Paket für Teams, die KI-Anwendungen während der Arbeit dokumentieren und danach direkt ins KI Register einreichen wollen.',
      agentKitBullets: [
        'Ein technisches Team richtet das Agent Kit einmalig im Projekt oder Workspace ein.',
        'Danach kann ein Agent während der eigentlichen Arbeit fehlende Angaben nachfragen, die Dokumentation zusammenfassen und erst nach Bestätigung schreiben.',
        'Beispiele: Codex dokumentiert beim Bauen eines internen Support-Agenten mit, OpenClaw erfasst einen Recruiting-Workflow und Claude Code bereitet vor dem Go-Live die Register-Einreichung vor.',
        'Teamleads müssen später meist nicht mit Dateien arbeiten, sondern sehen den bestätigten Fall direkt im KI Register.',
        'Die volle technische Erklärung liegt in der API-Doku. GitHub, API-Key und ZIP folgen direkt darunter.',
      ],
      agentKitDocs: 'Volle Erklärung',
      agentKitSettings: 'API-Key einrichten',
      technicalKicker: 'Download für technische Teams',
      technicalTitle: 'Download und Links',
      technicalBody:
        'GitHub ist die sauberste Quelle. Das ZIP ist für Teams, die schnell lokal starten wollen. Den API-Key erstellt die eingeloggte Person im KI Register.',
      githubSource: 'GitHub-Quelle',
      readDocs: 'API-Doku lesen',
      createApiKey: 'API-Key erstellen',
      zipDownload: 'ZIP herunterladen',
      agentKitInstallSteps: [
        'GitHub-Repo öffnen oder `ki-register-agent-kit.zip` herunterladen und lokal entpacken.',
        'Einmalig onboarden: `node ./bin/studio-agent.mjs onboard`',
        'Während der Arbeit dokumentieren: `node ./bin/studio-agent.mjs capture` oder `interview`',
        'API-Key im Login-Bereich erstellen und danach direkt ins KI Register einreichen.',
      ],
    };
  }

  return {
    appName: 'AI Registry',
    metadataTitle: 'Downloads | AI Registry',
    metadataDescription:
      'Download the Chrome extension, macOS menu bar app and Agent Kit for AI Registry.',
    headerLabel: 'AI Registry',
    pageTitle: 'Downloads',
    backHome: 'Back to home',
    infoNote:
      'Both downloads open the existing Quick Capture surface of AI Registry. Content and governance stay inside the same register standard on kiregister.com.',
    overviewLabel: 'Quick overview',
    overviewTitle: 'Downloads for Quick Capture',
    installation: 'Installation',
    chromeTitle: 'Chrome extension',
    chromeSubtitle:
      'Quick Capture directly from the browser toolbar, including shortcut, context menu and optional Coverage Assist.',
    chromeDownload: 'Download Chrome extension',
    chromeSteps: [
      'Open Chrome and go to `chrome://extensions`.',
      'Enable developer mode in the top-right corner.',
      'Unzip `ki-register-quick-capture-chrome.zip`.',
      'Click "Load unpacked" and select the unzipped folder.',
      'Pin the extension and open Quick Capture from the icon in the mini window.',
      ...(coverageAssistPilotEnabled
        ? [
            'Coverage Assist is optional: the local host match can be enabled or disabled per device inside the extension.',
          ]
        : []),
      'No domain setup required: the extension uses `kiregister.com` by default.',
    ],
    macTitle: 'Mac menu bar app',
    macSubtitle:
      'Native macOS app: opens Quick Capture from the menu bar next to Wi-Fi and battery.',
    macDownload: 'Download Mac app',
    macSteps: [
      'Unzip `ki-register-menubar-macos.zip`.',
      'Move `KI-Register-MenuBar.app` into Applications.',
      'Open the app with right-click on first launch.',
      'If macOS blocks it: System Settings -> Privacy & Security -> Open Anyway.',
      'If it is still blocked: `xattr -dr com.apple.quarantine /Applications/KI-Register-MenuBar.app`',
      'After launch the icon appears in the menu bar next to Wi-Fi and battery.',
    ],
    coverageCards: [
      {
        title: 'Coverage Assist',
        body:
          'The Chrome extension can optionally detect known AI hosts locally on the current tab and prepare the jump into Quick Capture.',
      },
      {
        title: 'Trust boundary',
        body:
          'Nothing is saved automatically. The actual use case is only created after you confirm or adjust it inside the register.',
      },
      {
        title: 'Local and switchable',
        body:
          'Coverage Assist uses local host matching, stores no browser history and can be disabled in the extension at any time.',
      },
    ],
    agentKitKicker: 'Agent Kit',
    agentKitTitle: 'How teams use it',
    agentKitBody:
      'This is the short introduction for technical teams. It is not a standard end-user download, but a package for teams that document AI applications during work and then submit them directly into the AI Registry.',
    agentKitBullets: [
      'A technical team sets up Agent Kit once per project or workspace.',
      'After that, an agent can ask for missing facts during the real work, summarise the documentation, and only write after explicit confirmation.',
      'Examples: Codex documents an internal support agent while building it, OpenClaw captures a recruiting workflow, and Claude Code prepares the register submission before go-live.',
      'Team leads usually do not need to work with files later; they only see the confirmed use case directly in AI Registry.',
      'The full technical explanation lives in the API docs. GitHub, API key setup and ZIP download are right below.',
    ],
    agentKitDocs: 'Full explanation',
    agentKitSettings: 'Set up API key',
    technicalKicker: 'Download for technical teams',
    technicalTitle: 'Download and links',
    technicalBody:
      'GitHub is the cleanest source. The ZIP is for teams that want a fast local start. The signed-in user creates the API key inside AI Registry.',
    githubSource: 'GitHub source',
    readDocs: 'Read API docs',
    createApiKey: 'Create API key',
    zipDownload: 'Download ZIP',
    agentKitInstallSteps: [
      'Open the GitHub repo or download `ki-register-agent-kit.zip` and unpack it locally.',
      'Run onboarding once: `node ./bin/studio-agent.mjs onboard`',
      'Document during the work: `node ./bin/studio-agent.mjs capture` or `interview`',
      'Create the API key in the signed-in area and then submit directly into AI Registry.',
    ],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDownloadsCopy(locale);

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

function SectionCard({
  title,
  subtitle,
  downloadHref,
  downloadLabel,
  installationLabel,
  steps,
}: {
  title: string;
  subtitle: string;
  downloadHref: string;
  downloadLabel: string;
  installationLabel: string;
  steps: string[];
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

      <div className="mt-5">
        <a
          href={downloadHref}
          className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </a>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {installationLabel}
        </p>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          {steps.map((step) => (
            <li key={step} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export default async function DownloadsPage({ params }: Props) {
  const { locale } = await params;
  const copy = getDownloadsCopy(locale);
  const agentKitDocsHref = localizeHref(locale, '/developers/agent-kit');
  const agentKitSettingsHref = localizeHref(locale, '/settings/agent-kit');
  const homeHref = localizeHref(locale, '/');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_45%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <Link
            href={homeHref}
            className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
            aria-label={copy.backHome}
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
                {copy.headerLabel}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">{copy.pageTitle}</h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copy.backHome}
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />
            <p className="text-sm leading-relaxed text-slate-700">{copy.infoNote}</p>
          </div>
        </section>

        {coverageAssistPilotEnabled ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {copy.coverageCards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{card.body}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="mt-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {copy.overviewLabel}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {copy.overviewTitle}
            </h2>
          </div>
        </section>

        <main className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard
            title={copy.chromeTitle}
            subtitle={copy.chromeSubtitle}
            downloadHref="/downloads/ki-register-quick-capture-chrome.zip"
            downloadLabel={copy.chromeDownload}
            installationLabel={copy.installation}
            steps={copy.chromeSteps}
          />

          <SectionCard
            title={copy.macTitle}
            subtitle={copy.macSubtitle}
            downloadHref="/downloads/ki-register-menubar-macos.zip"
            downloadLabel={copy.macDownload}
            installationLabel={copy.installation}
            steps={copy.macSteps}
          />
        </main>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {copy.agentKitKicker}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{copy.agentKitTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{copy.agentKitBody}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            {copy.agentKitBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link
            href={agentKitDocsHref}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            {copy.agentKitDocs}
          </Link>
          <Link
            href={agentKitSettingsHref}
            className="mt-4 ml-3 inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <ArrowUpRight className="h-4 w-4" />
            {copy.agentKitSettings}
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-900 bg-white p-6 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.technicalKicker}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {copy.technicalTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{copy.technicalBody}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={agentKitGithubHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <ArrowUpRight className="h-4 w-4" />
              {copy.githubSource}
            </a>
            <Link
              href={agentKitDocsHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              {copy.readDocs}
            </Link>
            <Link
              href={agentKitSettingsHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              {copy.createApiKey}
            </Link>
            <a
              href="/downloads/ki-register-agent-kit.zip"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {copy.zipDownload}
            </a>
          </div>

          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {copy.installation}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {copy.agentKitInstallSteps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
