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

const agentKitSteps = [
  "Ein technisches Team oder ein Agent richtet das Agent Kit einmalig im Projekt oder Workspace ein.",
  "Beim ersten Start werden Grundinfos abgefragt: wer dokumentiert, wo Dateien liegen und welche Defaults gelten.",
  "Danach kann der Agent neue KI-Anwendungen, Prozesse oder Workflows direkt waehrend der Arbeit miterfassen.",
  "Wenn Informationen fehlen, fuehrt das Kit durch ein kurzes Interview und fragt die wichtigsten Punkte systematisch ab.",
  "Vor jedem neuen Eintrag zeigt es eine Zusammenfassung und bittet um ausdrueckliche Bestaetigung.",
  "Mit einem Agent-Kit-API-Key kann das bestaetigte manifest.json danach direkt in das KI-Register eingereicht werden, sodass Teamleads den Fall dort sehen.",
];

const agentKitExamples: Array<{
  title: string;
  setup: string;
  prompt: string;
}> = [
  {
    title: "Codex App oder Claude Code",
    setup:
      "Laden Sie das GitHub-Repo oder die ZIP in Ihr Projekt und oeffnen Sie den Ordner in Codex App oder Claude Code. Danach reicht ein normaler Prompt.",
    prompt:
      "Nutze das Repository ki-register-agent-kit in diesem Workspace. Falls noch kein Onboarding vorhanden ist, fuehre mich zuerst durch die Grundeinrichtung. Dokumentiere dann diese neue KI-Anwendung, stelle Rueckfragen bei fehlenden Informationen, frage mich vor dem Schreiben nach einer klaren Bestaetigung und reiche das bestaetigte manifest danach mit dem vorhandenen Agent-Kit-API-Key im KI-Register ein.",
  },
  {
    title: "OpenClaw oder andere Skill-Agenten",
    setup:
      "Installieren oder referenzieren Sie das Skill aus dem Agent-Kit-Repo. Danach kann der Agent die Dokumentation waehrend der eigentlichen Arbeit miterfassen.",
    prompt:
      "Nutze das Skill studio-use-case-documenter. Wenn noch kein Profil vorhanden ist, onboarde mich zuerst. Erfasse diesen neuen Workflow, interviewe mich zu Zweck, Owner, Daten, Risiken und Kontrollen, zeige mir die geplante Dokumentation vor dem Schreiben und sende die bestaetigte Manifest-Datei danach in unser KI-Register.",
  },
  {
    title: "Antigravity oder andere Agenten",
    setup:
      "Wenn Ihr Agent keine Skills kennt, reicht meist schon das CLI aus dem Repo. Wichtig ist nur, dass der Agent lokal Dateien lesen und anlegen darf.",
    prompt:
      "Nutze das CLI aus dem Repository ki-register-agent-kit fuer diesen neuen Anwendungsfall. Frage mich Schritt fuer Schritt nach den fehlenden Informationen, fasse alles kurz zusammen, lege die Dokumentation erst an, wenn ich die finale Zusammenfassung bestaetigt habe, und uebermittle die finale Manifest-Datei anschliessend mit unserem API-Key an das KI-Register.",
  },
];

function SectionCard({
  title,
  subtitle,
  downloadHref,
  downloadLabel,
  steps,
  secondaryActions,
}: {
  title: string;
  subtitle: string;
  downloadHref: string;
  downloadLabel: string;
  steps: string[];
  secondaryActions?: Array<{
    href: string;
    label: string;
  }>;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={downloadHref}
          className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </a>

        {secondaryActions?.map((action) => (
          <a
            key={action.href}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            {action.label}
          </a>
        ))}
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
          <h2 className="text-lg font-semibold text-slate-900">Nutzung</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>
              Beim ersten Öffnen prüft Quick Capture deinen Login. Angemeldet speichert direkt im Register.
            </li>
            <li>
              Ohne Login kannst du als Gast fortfahren; diese Einträge werden lokal im Browser gespeichert.
            </li>
            {coverageAssistPilotEnabled ? (
              <>
                <li>
                  Coverage Assist prüft im Plugin nur den aktuellen Host und bleibt standardmäßig aus, bis du ihn auf diesem Gerät aktivierst.
                </li>
                <li>
                  Auch mit Coverage Assist wird nichts automatisch angelegt; die Bestaetigung passiert immer erst im Register.
                </li>
              </>
            ) : null}
            <li>
              Logo/Icon wechseln automatisch zwischen Light- und Dark-Variante je nach Browser-Theme.
            </li>
            {coverageAssistPilotEnabled ? (
              <li>
                Coverage Assist kann im Plugin pro Gerät jederzeit wieder deaktiviert oder für einzelne Tools lokal ausgeblendet werden.
              </li>
            ) : null}
            <li>
              Empfohlen: Links nur über diese Download-Seite verteilen, damit alle die aktuelle Version nutzen.
            </li>
            <li>
              Das Agent Kit wird weiter unten separat erklaert, weil es kein klassischer Endnutzer-Download, sondern ein Team- und Agentenpaket ist.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Agent Kit einfach erklaert
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Das Agent Kit hilft Teams, neue KI-Anwendungen direkt waehrend der Arbeit zu dokumentieren.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Statt spaeter manuell ein Formular auszufuellen, geben Sie einem Agenten einen klaren
              Auftrag. Das Kit fuehrt durch Fragen, interviewt bei fehlenden Informationen, zeigt
              vor dem Schreiben eine Zusammenfassung und legt die Dokumentation erst nach Ihrer
              Bestaetigung an.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Das Agent Kit hat dafuer jetzt ein eigenes oeffentliches GitHub-Repository, damit es
              leichter in Codex, OpenClaw, Antigravity und aehnliche Agent-Umgebungen eingebunden
              werden kann.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Neu ist: Mit einem Agent-Kit-API-Key kann das bestaetigte Ergebnis danach direkt im
              KI-Register eingereicht werden. Teamleads muessen also nicht mit Dateien arbeiten,
              sondern sehen den neuen Fall direkt auf der Plattform.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={agentKitGithubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                GitHub-Repo
              </a>
              <a
                href={agentKitDocsHref}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                API-Doku auf kiregister.com
              </a>
              <a
                href={agentKitSettingsHref}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                API-Key im Login-Bereich
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Fuer Teamleads
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Teamleads sollen am Ende nicht mit Dateien arbeiten muessen, sondern den neuen
                bestaetigten Anwendungsfall direkt im KI-Register sehen. Das Paket selbst braucht
                in der Regel nur das technische Team, nicht die spaetere Review-Person.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Was technisch passiert
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Der Agent erzeugt zuerst eine lesbare Dokumentation und eine strukturierte
                JSON-Datei. Nach Ihrer Bestaetigung kann genau diese Manifest-Datei mit API-Key
                direkt ins KI-Register gesendet werden.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Wer das Paket braucht
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Das Paket ist fuer technische Teams und Agent-Owner gedacht, die diese Erfassung
                automatisieren wollen. Es bleibt absichtlich agent-neutral und funktioniert mit
                Codex, OpenClaw, Antigravity und aehnlichen Systemen.
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              So laeuft es ab
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {agentKitSteps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Beispiele fuer Agenten
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Diese Prompts koennen Sie Ihrem Agenten direkt schicken.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Sie muessen keine Spezialbefehle kennen. Kopieren Sie einfach einen passenden Prompt,
              schicken Sie ihn an Ihren Agenten und passen Sie nur noch den konkreten Use Case an.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Wenn Sie nur das Ergebnis im KI-Register sehen wollen, brauchen Sie diese Prompts
              nicht selbst. Sie sind fuer das technische Team oder die Person gedacht, die den
              Agenten einrichtet.
            </p>
            <div className="mt-4">
              <a
                href={agentKitGithubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                GitHub-Repo oeffnen
              </a>
              <a
                href={agentKitDocsHref}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                Website-API-Doku
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {agentKitExamples.map((example) => (
              <article key={example.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {example.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{example.setup}</p>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Beispiel-Prompt
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-800">
                    {example.prompt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-900 bg-white p-6 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Fuer Technische Teams
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Nicht jede Person braucht das ganze Paket.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Wenn Sie Teamlead oder Fachbereich sind, ist fuer Sie spaeter der sichtbare Eintrag
              im KI-Register entscheidend. Den Download brauchen vor allem technische Teams oder
              Agent-Owner, die das Agent Kit in einen Workflow, ein Repository oder einen Agenten
              einbauen wollen.
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
        </section>

        <section className="mt-8 rounded-2xl border border-slate-900 bg-white p-6 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Open Source & Marketplace Ready
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Das Agent Kit ist nicht nur ein Download, sondern ein veroeffentlichbares Standardpaket.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Die aktuelle Version bringt Public-Repo-Hygiene, Marketplace-Collateral und
              agent-neutrale Manifest-Ausgaben schon mit. Dadurch kann das Paket spaeter sauber auf
              GitHub, in ClawHub oder in SkillsMP-aehnlichen Verzeichnissen veroeffentlicht werden.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-300 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                GitHub Ready
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Enthält README-Grafiken, Lizenz, Contribution- und Security-Dateien, Issue-Templates,
                Pull-Request-Template und eine kleine GitHub-Action fuer Smoke-Tests.
              </p>
            </article>

            <article className="rounded-xl border border-slate-300 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                OpenClaw / ClawHub
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Die Skill-Struktur bleibt bewusst nah an einem portablen `SKILL.md`-Bundle mit
                Agent-Metadaten, damit der Upload in skillbasierte Agent-Systeme moeglich bleibt.
              </p>
            </article>

            <article className="rounded-xl border border-slate-300 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                SkillsMP kompatibel
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Listing-Text, Publish-Checkliste und Slash-Command-Vorlage liegen direkt im Paket,
                damit ein Marketplace-Eintrag nicht noch separat zusammengesucht werden muss.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
