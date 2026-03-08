"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Link2,
  LockKeyhole,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { SetupSection } from "@/components/landing/setup-section";
import { ThemeAwareLogo } from "@/components/theme-aware-logo";
import { useAuth } from "@/context/auth-context";

type EntryMode = "admin" | "member";

const painPoints = [
  {
    title: "Schatten-KI ist schon da",
    copy:
      "Teams nutzen ChatGPT, Copilot, DeepL oder eigene Automationen oft laenger, bevor jemand eine belastbare Dokumentation anlegt.",
  },
  {
    title: "Verantwortung bleibt diffus",
    copy:
      "Ohne Register weiss niemand sauber, welcher Einsatzfall wem gehoert, wie er geprueft wird und welche Nachweise schon vorliegen.",
  },
  {
    title: "Der Nachweis kommt immer spaeter",
    copy:
      "Die Frage nach Transparenz, AI-Literacy oder Audit-Readiness kommt meist erst von Kund:innen, Auditor:innen oder Geschaeftsfuehrung.",
  },
];

const freeLayer = [
  "Register einrichten und ersten Einsatzfall erfassen",
  "Owner-Rolle festhalten und Use-Case-Pass als PDF oder JSON erzeugen",
  "Erfassungslink mit Team oder Lieferanten teilen",
  "Quick Capture im Browser, in der Menueleiste oder als Gast starten",
];

const paidLayer = [
  "Wiederkehrende Reviews, Fristen und Action Queue",
  "Organisationsweite Governance-Einstellungen und Policy-Pakete",
  "Audit-Export, org-weite Nachweise und Trust Portal",
  "Team-Literacy, Rollensteuerung und formale Freigabeprozesse",
];

const triggers = [
  {
    title: "Ab ca. 10 Einsatzfaellen",
    copy:
      "Das Register ist nicht mehr nur Dokumentation, sondern ein Steuerungsproblem.",
  },
  {
    title: "Sobald Reviews faellig werden",
    copy:
      "Dann reicht ein statischer Eintrag nicht mehr. Sie brauchen Wiederholung und Verantwortung.",
  },
  {
    title: "Bei extern sichtbarer KI",
    copy:
      "Sobald Kund:innen, Bewerber:innen oder Oeffentlichkeit betroffen sind, steigt der Bedarf an belastbarem Nachweis sprunghaft.",
  },
  {
    title: "Wenn mehrere Rollen beteiligt sind",
    copy:
      "Sobald Fachbereich, IT und Compliance mitreden, wird aus Erfassung Governance.",
  },
];

const trustPoints = [
  "Privacy-first: kein Mitarbeitenden-Tracking, sondern explizite Dokumentation von Einsatzfaellen.",
  "Minimalerfassung zuerst: Rolle vor Person, Nachweise spaeter erweiterbar.",
  "Exportierbar und teilbar: Use-Case-Pass als PDF oder JSON statt Lock-in.",
  "Klare Grenze: Register kostenlos, Control erst bei echter Organisationsreife.",
];

export default function LandingSimple4Page() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const setupRef = useRef<HTMLElement>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("admin");

  useEffect(() => {
    if (searchParams.get("mode") === "member") {
      setEntryMode("member");
    }
  }, [searchParams]);

  const scrollToSetup = useCallback((mode: EntryMode) => {
    setEntryMode(mode);
    requestAnimationFrame(() => {
      setupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3efe6_0%,#faf8f2_28%,#ffffff_70%)] text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-300/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-300 bg-white/80 p-2 shadow-sm">
              <ThemeAwareLogo
                alt="KI-Register"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Register First
              </p>
              <p className="text-sm font-medium text-slate-800">KI-Register</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/downloads"
              className="hidden text-sm text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <Download className="h-4 w-4" />
              Downloads
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
            >
              Anmelden
            </Link>
          </div>
        </header>

        <main className="space-y-20 pt-12">
          <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/75 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                EU AI Act fuer KMU, ohne Enterprise-Overkill
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Starten Sie mit dem Register.
                  <span className="block text-slate-500">
                    Nicht mit Buerokratie.
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
                  Erfassen Sie reale KI-Einsatzfaelle, vergeben Sie klare Owner-Rollen
                  und erzeugen Sie sofort einen belastbaren Use-Case-Pass. Das
                  Register bleibt kostenlos. Governance Control beginnt erst dann,
                  wenn Ihr Register wirklich nach Steuerung verlangt.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollToSetup("admin")}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  KI-Register einrichten
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSetup("member")}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                >
                  Einladungscode verwenden
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <TrustChip icon={LockKeyhole} label="Ohne Kreditkarte" />
                <TrustChip icon={FileText} label="PDF und JSON Pass" />
                <TrustChip icon={Users} label="Team-Link statt Chaos" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-300 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Nach dem ersten Eintrag
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      Sofort sichtbarer Nutzen
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Kostenlos
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <ProofRow
                    title="Use-Case-Pass erzeugen"
                    copy="Exportierbarer Nachweis statt losem Tool-Spreadsheet."
                  />
                  <ProofRow
                    title="Owner-Rolle klar zuweisen"
                    copy="Verantwortung wird nachvollziehbar, ohne gleich Governance-Programme aufzusetzen."
                  />
                  <ProofRow
                    title="Erfassungslink mit dem Team teilen"
                    copy="Weitere Eintraege kommen ueber einen simplen Link, nicht ueber ein grosses Rollout-Projekt."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FeaturePanel
                  eyebrow="Register"
                  title="Bleibt frei"
                  copy="Dokumentieren, teilen, exportieren. Der Startpunkt fuer jedes KMU."
                />
                <FeaturePanel
                  eyebrow="Control"
                  title="Kommt spaeter"
                  copy="Nur wenn Reviews, Fristen, Policies und Nachweise organisationsweit gesteuert werden muessen."
                />
              </div>
            </div>
          </section>

          <section className="space-y-7">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Warum diese Reihenfolge zaehlt
              </p>
              <h2 className="font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                KMU scheitern selten an fehlender Governance zuerst.
              </h2>
              <p className="text-base leading-relaxed text-slate-700">
                Sie scheitern daran, dass niemand sauber benennen kann, welche KI
                ueberhaupt im Einsatz ist, wem sie gehoert und welcher Nachweis
                schon existiert. Genau dort muss die Landing anfangen.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {painPoints.map((point) => (
                <article
                  key={point.title}
                  className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-sm font-semibold text-slate-900">{point.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {point.copy}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <LayerCard
              title="Was im Register kostenlos bleiben sollte"
              intro="Das ist die Basisschicht fuer Vertrauen, Adoption und den Standard-Effekt."
              items={freeLayer}
              tone="light"
            />
            <LayerCard
              title="Wofuer spaeter bezahlt werden sollte"
              intro="Nicht fuer das Erfassen. Sondern fuer wiederkehrende Steuerung."
              items={paidLayer}
              tone="dark"
            />
          </section>

          <section
            ref={setupRef}
            className="rounded-[28px] border border-slate-300 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <div className="mb-8 max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Startpunkt
              </p>
              <h2 className="font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                Einrichten, ersten Einsatzfall erfassen, dann erst ueber Team und
                Governance sprechen.
              </h2>
              <p className="text-base leading-relaxed text-slate-700">
                Das Setup bleibt bewusst ruhig: zuerst eigener Start, dann optional
                Team-Freigabe. Genau diese Reihenfolge ist bereits richtig angelegt und
                sollte hier noch klarer ins Zentrum.
              </p>
            </div>

            <SetupSection
              entryMode={entryMode}
              onEntryModeChange={setEntryMode}
              user={user}
            />
          </section>

          <section className="space-y-7">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Upgrade-Logik
              </p>
              <h2 className="font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                Wann AI Governance Control wirklich sinnvoll wird
              </h2>
              <p className="text-base leading-relaxed text-slate-700">
                Nicht am ersten Tag. Sondern dann, wenn aus Dokumentation
                wiederkehrende Koordination wird.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {triggers.map((trigger) => (
                <article
                  key={trigger.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5"
                >
                  <p className="text-sm font-semibold text-slate-900">{trigger.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {trigger.copy}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Privacy & Trust
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight">
                Ein KI-Register muss ruhig wirken.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Nicht wie Ueberwachung. Nicht wie Enterprise-Theater. Sondern wie
                ein pragmischer Nachweisstandard fuer reale KI-Nutzung.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/85 p-6">
              <ul className="space-y-3">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/downloads"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                  Quick-Capture Tools ansehen
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSetup("admin")}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  {loading ? (
                    <>
                      Lade Setup
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Kostenlos starten
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function TrustChip({
  icon: Icon,
  label,
}: {
  icon: typeof LockKeyhole;
  label: string;
}) {
  return (
    <div className="rounded-full border border-slate-300 bg-white/75 px-3 py-2 text-sm text-slate-700 shadow-sm">
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    </div>
  );
}

function ProofRow({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{copy}</p>
    </div>
  );
}

function FeaturePanel({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy}</p>
    </div>
  );
}

function LayerCard({
  title,
  intro,
  items,
  tone,
}: {
  title: string;
  intro: string;
  items: string[];
  tone: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <div
      className={
        isDark
          ? "rounded-[24px] border border-slate-800 bg-slate-950 p-6 text-white"
          : "rounded-[24px] border border-slate-200 bg-white/90 p-6"
      }
    >
      <p
        className={
          isDark
            ? "text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
            : "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
        }
      >
        {isDark ? "Paid Layer" : "Free Layer"}
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight">{title}</h2>
      <p
        className={
          isDark
            ? "mt-3 text-sm leading-relaxed text-slate-300"
            : "mt-3 text-sm leading-relaxed text-slate-600"
        }
      >
        {intro}
      </p>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm">
            <Link2
              className={
                isDark
                  ? "mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                  : "mt-0.5 h-4 w-4 shrink-0 text-slate-700"
              }
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
