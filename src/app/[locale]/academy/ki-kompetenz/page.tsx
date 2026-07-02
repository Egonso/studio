import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Art4AiDisclosure,
  Art4BadgeRow,
} from '@/components/art4/art4-module-client';
import { MarketingShell } from '@/components/product-shells';
import { ART4_MODULES } from '@/lib/art4-training/definitions';

export const metadata: Metadata = {
  title: 'KI-Kompetenz nach Art. 4 — kostenlose Rollenschulungen | KI Register',
  description:
    'Kostenlose, rollenspezifische Kurzschulungen (KI-generiert) zur KI-Kompetenz nach Art. 4 EU AI Act — mit Lernkontrolle und prüfbarem Zertifikat.',
};

export default async function Art4ProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <header className="space-y-5 border-b border-slate-200 pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            KI Register Academy · Art. 4 · Verordnung (EU) 2024/1689
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
            KI-Kompetenz nach Art. 4 — die Rollenschulung für Ihr ganzes Team.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Seit Februar 2025 müssen Organisationen die KI-Kompetenz ihres
            Personals sicherstellen — rollenbezogen, nicht pauschal. Diese vier
            Kurzmodule decken die Kernrollen ab: je ein Video, acht Fragen, und
            ein persönlicher Nachweis mit öffentlich prüfbarem Verify-Link.
          </p>
          <Art4BadgeRow />
        </header>

        <section
          className="mt-10 grid gap-4 sm:grid-cols-2"
          aria-label="Rollen wählen"
        >
          {ART4_MODULES.map((module, index) => (
            <Link
              key={module.slug}
              href={`/${locale}/academy/ki-kompetenz/${module.slug}`}
              className="group flex flex-col border border-slate-200 bg-white p-6 transition-colors hover:border-slate-950"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Modul {String.fromCharCode(65 + index)}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                {module.role}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {module.summary}
              </p>
              <p className="mt-4 text-sm text-slate-500">{module.duration}</p>
              <p className="mt-4 text-sm font-medium text-slate-950 underline-offset-4 group-hover:underline">
                Schulung starten →
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-10 space-y-4">
          <Art4AiDisclosure />
          <div className="grid gap-4 border border-slate-200 bg-white p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                1 · Video ansehen
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                6–8 Minuten, rollenspezifisch, ohne Anmeldung abspielbar.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                2 · Lernkontrolle bestehen
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                8 Fragen, bestanden ab 6 richtigen Antworten, beliebig
                wiederholbar. Kostenloses Konto genügt.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                3 · Nachweis nutzen
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Zertifikat als PDF mit Verify-Link — als Schulungsnachweis an
                Ihre Einsatzfälle im KI-Register anhängbar.
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Für die vertiefte EU-AI-Act-Kompetenz (4 Stunden, mit Prof. Dr.
            Janine Wendt) siehe{' '}
            <Link
              href={`/${locale}/fortbildung`}
              className="text-slate-950 underline underline-offset-4 hover:text-slate-600"
            >
              das Fortbildungspaket
            </Link>
            .
          </p>
        </section>
      </main>
    </MarketingShell>
  );
}
