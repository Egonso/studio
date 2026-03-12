import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Download, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Downloads | KI-Register",
  description:
    "Chrome Plugin und macOS Menüleisten-App für KI-Register herunterladen.",
};

const chromeSteps = [
  "Chrome öffnen und chrome://extensions aufrufen.",
  "Rechts oben Entwicklermodus aktivieren.",
  "Download ki-register-quick-capture-chrome.zip entpacken.",
  "Entpackte Erweiterung laden klicken und den entpackten Ordner auswählen.",
  "Extension anheften und über das Icon Quick Capture im Mini-Fenster öffnen.",
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
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
          <div className="flex items-center gap-3">
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
          </div>

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

        <main className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Chrome Plugin"
            subtitle="Quick Capture direkt aus der Browser-Toolbar, inklusive Shortcut und Kontextmenü."
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
            <li>
              Logo/Icon wechseln automatisch zwischen Light- und Dark-Variante je nach Browser-Theme.
            </li>
            <li>
              Empfohlen: Links nur über diese Download-Seite verteilen, damit alle die aktuelle Version nutzen.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
