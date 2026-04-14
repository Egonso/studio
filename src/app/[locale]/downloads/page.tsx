import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Download, ShieldCheck } from "lucide-react";
import { isCoverageAssistPilotEnabled } from "@/lib/coverage-assist/feature-gate";
import { registerFirstFlags } from "@/lib/register-first/flags";

export const metadata: Metadata = {
  title: "Downloads | KI-Register",
  description:
    "Chrome Plugin, macOS Menueleisten-App und Agent Kit fuer KI-Register herunterladen.",
};

const coverageAssistPilotEnabled = isCoverageAssistPilotEnabled(registerFirstFlags);
const agentKitGithubHref = "https://github.com/Egonso/ki-register-agent-kit";
const agentKitDocsHref = "/developers/agent-kit";
const agentKitSettingsHref = "/settings/agent-kit";

const chromeSteps = [
  "Chrome öffnen und chrome://extensions aufrufen.",
  "Rechts oben Entwicklermodus aktivieren.",
  "Download ki-register-quick-capture-chrome.zip entpacken.",
  "Entpackte Erweiterung laden klicken und den entpackten Ordner auswählen.",
  "Extension anheften und über das Icon Quick Capture im Mini-Fenster öffnen.",
  ...(coverageAssistPilotEnabled
    ? [
        "Coverage Assist ist optional: lokaler Host-Match kann im Plugin pro Gerät aktiviert oder deaktiviert werden.",
      ]
    : []),
  "Keine Domain-Einstellung nötig: die Extension nutzt standardmäßig kiregister.com.",
];

const macSteps = [
  "Download ki-register-menubar-macos.zip entpacken.",
  "KI-Register-MenuBar.app nach Programme ziehen.",
  "App per Rechtsklick öffnen (beim ersten Start).",
  "Falls macOS blockiert: Systemeinstellungen -> Datenschutz & Sicherheit -> Trotzdem öffnen.",
  "Falls weiterhin blockiert: xattr -dr com.apple.quarantine /Applications/KI-Register-MenuBar.app",
  "Nach dem Start erscheint das Icon oben in der Menüleiste neben WLAN/Batterie.",
];

const agentKitInstallSteps = [
  "GitHub-Repo oeffnen oder ki-register-agent-kit.zip herunterladen und lokal entpacken.",
  "Einmalig onboarden: node ./bin/studio-agent.mjs onboard",
  "Waehrend der Arbeit dokumentieren: node ./bin/studio-agent.mjs capture oder interview",
  "API-Key im Login-Bereich erstellen und danach direkt ins KI-Register einreichen.",
];

function SectionCard({
  title,
  subtitle,
  downloadHref,
  downloadLabel,
  steps,
}: {
  title: string;
  subtitle: string;
  downloadHref: string;
  downloadLabel: string;
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
          Installation
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

export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_45%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
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
                KI-Register
              </p>
              <h1 className="text-2xl font-bold text-slate-900">Downloads</h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Zur Startseite
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />
            <p className="text-sm leading-relaxed text-slate-700">
              Beide Downloads öffnen die bestehende Quick-Capture-Maske des KI-Registers.
              Inhalte und Governance bleiben im gleichen Register-Standard auf kiregister.com.
            </p>
          </div>
        </section>

        {coverageAssistPilotEnabled ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Coverage Assist
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Das Chrome Plugin kann optional bekannte KI-Hosts lokal auf dem aktuellen Tab
                erkennen und den Einstieg in Quick Capture vorbereiten.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Vertrauensgrenze
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Es gibt keine automatische Speicherung. Der eigentliche Einsatzfall wird erst im
                Register von Ihnen bestaetigt oder angepasst.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Lokal und abschaltbar
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Coverage Assist arbeitet mit lokalem Host-Match, speichert keine Browser-History
                und kann im Plugin jederzeit wieder deaktiviert werden.
              </p>
            </article>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Kurze Übersicht
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Downloads fuer Quick Capture
            </h2>
          </div>
        </section>

        <main className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Chrome Plugin"
            subtitle="Quick Capture direkt aus der Browser-Toolbar, inklusive Shortcut, Kontextmenü und optionalem Coverage Assist."
            downloadHref="/downloads/ki-register-quick-capture-chrome.zip"
            downloadLabel="Chrome Plugin herunterladen"
            steps={chromeSteps}
          />

          <SectionCard
            title="Mac Menüleisten-App"
            subtitle="Native macOS App: öffnet Quick Capture aus der Menüleiste oben neben WLAN/Batterie."
            downloadHref="/downloads/ki-register-menubar-macos.zip"
            downloadLabel="Mac App herunterladen"
            steps={macSteps}
          />
        </main>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Agent Kit
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Nutzung</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Ab hier geht es um eine kurze Einfuehrung ins Agent Kit. Das ist kein normaler
            Endnutzer-Download, sondern ein Paket fuer Teams, die KI-Anwendungen waehrend der
            Arbeit dokumentieren und danach direkt ins KI-Register einreichen wollen.
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>
              Ein technisches Team richtet das Agent Kit einmalig im Projekt oder Workspace ein.
            </li>
            <li>
              Danach kann ein Agent waehrend der eigentlichen Arbeit fehlende Angaben nachfragen, die Dokumentation zusammenfassen und erst nach Bestaetigung schreiben.
            </li>
            <li>
              Beispiele: Codex dokumentiert beim Bauen eines internen Support-Agenten mit, OpenClaw erfasst einen Recruiting-Workflow und Claude Code bereitet vor dem Go-Live die Register-Einreichung vor.
            </li>
            <li>
              Teamleads muessen spaeter meist nicht mit Dateien arbeiten, sondern sehen den bestaetigten Fall direkt im KI-Register.
            </li>
            <li>
              Die volle technische Erklaerung liegt in der API-Doku. GitHub, API-Key und ZIP kommen direkt darunter.
            </li>
          </ul>
          <a
            href={agentKitDocsHref}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            Volle Erklärung
          </a>
          <a
            href={agentKitSettingsHref}
            className="mt-4 ml-3 inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <ArrowUpRight className="h-4 w-4" />
            API-Key einrichten
          </a>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-900 bg-white p-6 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Download Fuer Technische Teams
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Download und Links
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              GitHub ist die sauberste Quelle. Das ZIP ist für Teams, die schnell lokal starten
              wollen. Den API-Key erstellt die eingeloggte Person im KI-Register.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={agentKitGithubHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <ArrowUpRight className="h-4 w-4" />
              GitHub-Quelle
            </a>
            <a
              href={agentKitDocsHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              API-Doku lesen
            </a>
            <a
              href={agentKitSettingsHref}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              API-Key erstellen
            </a>
            <a
              href="/downloads/ki-register-agent-kit.zip"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              ZIP herunterladen
            </a>
          </div>

          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Installation
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {agentKitInstallSteps.map((step) => (
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
