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
const agentKitGithubHref =
  "https://github.com/Egonso/studio/tree/codex/agent-kit-public/agent-kit";

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
  "Download ki-register-agent-kit.zip herunterladen und entpacken.",
  "Beim ersten Start werden einmalig Grundinfos abgefragt: wer dokumentiert, wo die Dateien liegen sollen und welche Defaults gelten.",
  "Danach kann das Kit neue KI-Anwendungen, Prozesse oder Workflows direkt waehrend der Arbeit miterfassen.",
  "Wenn Informationen fehlen, fuehrt das Kit durch ein kurzes Interview und fragt die wichtigsten Punkte systematisch ab.",
  "Vor jedem neuen Eintrag zeigt es noch einmal eine kurze Zusammenfassung und bittet um Bestaetigung.",
  "Das Ergebnis ist immer eine lesbare Dokumentation fuer Menschen plus eine strukturierte JSON-Datei fuer Audits und Agenten.",
];

function SectionCard({
  title,
  subtitle,
  downloadHref,
  downloadLabel,
  steps,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  subtitle: string;
  downloadHref: string;
  downloadLabel: string;
  steps: string[];
  secondaryHref?: string;
  secondaryLabel?: string;
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

        {secondaryHref ? (
          <a
            href={secondaryHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            {secondaryLabel ?? "Mehr erfahren"}
          </a>
        ) : null}
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

        <main className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
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

          <SectionCard
            title="Agent Kit"
            subtitle="Ein Dokumentationspaket fuer Teams, die neue KI-Anwendungen, Prozesse und Workflows sauber festhalten wollen. Es fuehrt durch Fragen, legt verstaendliche Doku an und funktioniert mit vielen KI-Agenten."
            downloadHref="/downloads/ki-register-agent-kit.zip"
            downloadLabel="Agent Kit herunterladen"
            steps={agentKitSteps}
            secondaryHref={agentKitGithubHref}
            secondaryLabel="Auf GitHub ansehen"
          />
        </main>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Agent Kit einfach erklaert
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Das Agent Kit ist fuer Menschen und fuer Agenten gedacht.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Es ist keine klassische Endnutzer-App, sondern ein kleines Standardpaket fuer Teams,
              die neue KI-Anwendungen nicht nur bauen oder einsetzen, sondern gleichzeitig sauber
              dokumentieren wollen. Ein Entwickler oder KI-Agent kann es starten, das Kit fragt die
              wichtigen Punkte systematisch ab und erzeugt daraus eine nachvollziehbare Dokumentation.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Fuer Fachbereiche
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Wenn Sie keine technische Person sind, muessen Sie das Tool nicht selbst bedienen.
                Ein Teammitglied oder Agent fuehrt Sie durch ein kurzes Interview und erfasst Zweck,
                Owner, Systeme, Risiken und Kontrollen in einer klaren Struktur.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Was am Ende entsteht
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Pro Anwendungsfall entsteht eine lesbare Dokumentation fuer Menschen und eine
                strukturierte JSON-Datei fuer Agenten, Audits und spaetere Weiterverarbeitung. So
                bleibt die Dokumentation sowohl intern als auch regulatorisch anschlussfaehig.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Fuer technische Teams
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Technische Teams koennen das Paket direkt herunterladen, im Repository pruefen und
                in bestehende Agent-Workflows integrieren. Der aktuelle Quellstand ist bereits auf
                GitHub einsehbar.
              </p>
              <div className="mt-4">
                <a
                  href={agentKitGithubHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  GitHub-Quelle oeffnen
                </a>
              </div>
            </article>
          </div>
        </section>

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
              Das Agent Kit ist fuer neue Anwendungen, Prozesse und Workflows gedacht, die direkt waehrend agentischer Arbeit dokumentiert werden sollen.
            </li>
            <li>
              Auch fuer nicht-technische Teams ist das Kit nutzbar, weil die eigentliche Erfassung als gefuehrter Fragenprozess angelegt ist.
            </li>
            <li>
              Ueber das einmalige Onboarding speichert das CLI deine Defaults, fragt aber vor jeder Anlage oder Ueberschreibung noch einmal nach.
            </li>
            <li>
              Der Skill und das Manifest-Format sind absichtlich agent-neutral gehalten, damit mehrere Systeme dieselben Workflow-Ordner lesen und erweitern koennen.
            </li>
          </ul>
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
