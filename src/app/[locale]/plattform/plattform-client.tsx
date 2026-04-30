'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileArchive,
  FileSearch,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { localizeHref } from '@/lib/i18n/localize-href';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

const GOVERNANCE_COPY = {
  de: {
    eyebrow: 'Governance',
    title: 'Vom Register zur steuerbaren Governance-Ebene.',
    body:
      'Das Register bleibt der Record of Truth für einzelne KI-Einsatzfälle. Das Governance Control Center verdichtet diese Daten zu Reviews, Richtlinien, Portfolios, Audit-Lücken und exportierbaren Nachweisen auf Organisationsebene.',
    primaryCta: 'Governance-Angebot ansehen',
    secondaryCta: 'Fortbildungspaket ansehen',
    modelLabel: 'Arbeitsmodell',
    modelTitle: 'Vier Ebenen, dieselbe Datenbasis',
    modelItems: [
      {
        label: '1. Erfassen',
        title: 'Use Case Pass',
        body: 'Zweck, System, Owner, Risikoklasse und Nachweisstatus entstehen am Einsatzfall.',
      },
      {
        label: '2. Priorisieren',
        title: 'Action Queue',
        body: 'Überfällige Reviews, fehlende Owner, Policy-Lücken und Audit-Themen werden sortiert.',
      },
      {
        label: '3. Steuern',
        title: 'Control Center',
        body: 'Maturity, Portfolio, Richtlinien, Trust Portal und ISO-Sicht laufen zusammen.',
      },
      {
        label: '4. Exportieren',
        title: 'Audit-Dossier',
        body: 'Governance Report, ISO 42001 Dossier, Policy Bundle und Trust Bundle werden ableitbar.',
      },
    ],
    modulesLabel: 'Was praktisch enthalten ist',
    modules: [
      {
        title: 'Governance Maturity Model',
        body: 'Deterministische Reifegradlogik mit Kriterien für Dokumentation, Owner-Coverage, Reviews, Policy-Mapping, Audit-Historie und ISO-Readiness.',
      },
      {
        title: 'Reviews / Action Queue',
        body: 'Priorisierte Aufgabenliste mit Deep Links in den betroffenen Einsatzfall und konkretem Bearbeitungsfokus.',
      },
      {
        title: 'Portfolio Intelligence',
        body: 'Risikoverteilung, Fachbereichsanalyse, Owner-Performance, Status-Verteilung und Risk Concentration Index.',
      },
      {
        title: 'Policy Engine',
        body: 'Policy Coverage, Zuordnung von Richtlinien zu Einsatzfällen und deterministische Policy-Preview aus Registerdaten.',
      },
      {
        title: 'ISO & Audit Layer',
        body: 'Lifecycle-Summary, ISO-Clause-Fortschritt, Gap-Analyse und unveränderliche Review- und Statushistorie.',
      },
      {
        title: 'Organisations-Export-Center',
        body: 'ISO 42001 Dossier, Governance Report, Trust Portal Bundle und Policy Bundle als organisationsweite Artefakte.',
      },
    ],
    proofLabel: 'Positionierung',
    proofTitle: 'Governance arbeitet auf der Organisationsebene.',
    proofBody:
      'Der einzelne Einsatzfall bleibt im Register. Die Governance-Ebene bündelt viele Einsatzfälle zu steuerbaren Entscheidungen: Wer ist verantwortlich, welche Reviews sind fällig, welche Richtlinien greifen, welche Nachweise fehlen und welche Exporte sind auditfähig.',
    evidenceRows: [
      ['Record of Truth', 'Registerdaten und Use Case Pass'],
      ['Steuerung', 'Reviews, Action Queue, Policy-Mapping'],
      ['Audit', 'ISO Layer, immutable Historie, Export Center'],
      ['Externe Lesbarkeit', 'Trust Portal und Dossier-Bundles'],
    ],
  },
  en: {
    eyebrow: 'Governance',
    title: 'From registry to controllable governance layer.',
    body:
      'The registry remains the record of truth for individual AI use cases. The Governance Control Center turns those records into reviews, policies, portfolios, audit gaps and exportable organisation-level evidence.',
    primaryCta: 'View governance offer',
    secondaryCta: 'View training package',
    modelLabel: 'Operating model',
    modelTitle: 'Four layers, one data foundation',
    modelItems: [
      {
        label: '1. Capture',
        title: 'Use Case Pass',
        body: 'Purpose, system, owner, risk class and evidence status are created at use-case level.',
      },
      {
        label: '2. Prioritise',
        title: 'Action Queue',
        body: 'Overdue reviews, missing owners, policy gaps and audit topics are ordered for action.',
      },
      {
        label: '3. Govern',
        title: 'Control Center',
        body: 'Maturity, portfolio, policies, Trust Portal and ISO view come together.',
      },
      {
        label: '4. Export',
        title: 'Audit Dossier',
        body: 'Governance Report, ISO 42001 Dossier, Policy Bundle and Trust Bundle become derivable.',
      },
    ],
    modulesLabel: 'What is practically included',
    modules: [
      {
        title: 'Governance Maturity Model',
        body: 'Deterministic maturity logic across documentation, owner coverage, reviews, policy mapping, audit history and ISO readiness.',
      },
      {
        title: 'Reviews / Action Queue',
        body: 'Prioritised task list with deep links into the affected use case and the specific focus area.',
      },
      {
        title: 'Portfolio Intelligence',
        body: 'Risk distribution, department analysis, owner performance, status distribution and Risk Concentration Index.',
      },
      {
        title: 'Policy Engine',
        body: 'Policy coverage, mapping policies to use cases and deterministic policy previews from registry data.',
      },
      {
        title: 'ISO & Audit Layer',
        body: 'Lifecycle summary, ISO clause progress, gap analysis and immutable review and status history.',
      },
      {
        title: 'Organisation Export Center',
        body: 'ISO 42001 Dossier, Governance Report, Trust Portal Bundle and Policy Bundle as organisation-wide artefacts.',
      },
    ],
    proofLabel: 'Positioning',
    proofTitle: 'Governance operates at organisation level.',
    proofBody:
      'The individual use case remains in the registry. The governance layer bundles many use cases into controllable decisions: who is responsible, which reviews are due, which policies apply, which evidence is missing and which exports are audit-ready.',
    evidenceRows: [
      ['Record of truth', 'Registry data and Use Case Pass'],
      ['Control', 'Reviews, Action Queue, policy mapping'],
      ['Audit', 'ISO layer, immutable history, Export Center'],
      ['External readability', 'Trust Portal and dossier bundles'],
    ],
  },
};

const governanceIcons = [
  ShieldCheck,
  ListChecks,
  BarChart3,
  ClipboardCheck,
  FileSearch,
  FileArchive,
];

export default function PlattformPageClient() {
  const locale = useLocale();
  const t = useTranslations();
  const governanceCopy =
    locale === 'en' ? GOVERNANCE_COPY.en : GOVERNANCE_COPY.de;

  const pillars: Array<{
    id: string;
    titleKey: string;
    bodyKey: string;
    bearerKey: string;
    href?: string;
    ctaKey?: string;
  }> = [
    {
      id: 'register',
      titleKey: 'plattform.pillars.register.title',
      bodyKey: 'plattform.pillars.register.body',
      bearerKey: 'plattform.pillars.register.bearer',
    },
    {
      id: 'governance',
      titleKey: 'plattform.pillars.governance.title',
      bodyKey: 'plattform.pillars.governance.body',
      bearerKey: 'plattform.pillars.governance.bearer',
      href: '/governance',
      ctaKey: 'plattform.pillars.governance.cta',
    },
    {
      id: 'fortbildung',
      titleKey: 'plattform.pillars.fortbildung.title',
      bodyKey: 'plattform.pillars.fortbildung.body',
      bearerKey: 'plattform.pillars.fortbildung.bearer',
      href: '/fortbildung',
      ctaKey: 'plattform.pillars.fortbildung.cta',
    },
  ];

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link
            href={localizeHref(locale, '/')}
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt={t('metadata.appName')}
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>{t('metadata.appName')}</span>
          </Link>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link
              href={localizeHref(locale, '/')}
              className="underline-offset-4 hover:text-slate-950 hover:underline"
            >
              {t('nav.home')}
            </Link>
            <a
              href={WHITEPAPER_HREF}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-slate-950 hover:underline"
            >
              {t('nav.whitepaper')}
            </a>
          </div>
        </header>

        <div className="space-y-10">
          <section className="space-y-4 border-b border-slate-200 pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('plattform.kicker')}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              {t('plattform.title')}
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              {t('plattform.subtitle')}
            </p>
            <p className="max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              {t('plattform.lead')}
            </p>
          </section>

          <section
            id="governance"
            className="scroll-mt-10 space-y-8 border-b border-slate-200 pb-10"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {governanceCopy.eyebrow}
                </p>
                <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                  {governanceCopy.title}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
                  {governanceCopy.body}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={localizeHref(locale, '/governance')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    {governanceCopy.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={localizeHref(locale, '/fortbildung')}
                    className="inline-flex min-h-11 items-center justify-center rounded-none border border-slate-300 px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
                  >
                    {governanceCopy.secondaryCta}
                  </Link>
                </div>
              </div>

              <aside className="border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {governanceCopy.proofLabel}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {governanceCopy.proofTitle}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {governanceCopy.proofBody}
                </p>
                <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {governanceCopy.evidenceRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-950">{label}</span>
                      <span className="leading-6 text-slate-600">{value}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {governanceCopy.modelLabel}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {governanceCopy.modelTitle}
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {governanceCopy.modelItems.map((item) => (
                  <article
                    key={item.label}
                    className="border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <h4 className="mt-3 text-base font-semibold text-slate-950">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {governanceCopy.modulesLabel}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {governanceCopy.modules.map((module, index) => {
                  const Icon = governanceIcons[index] ?? ShieldCheck;

                  return (
                    <article
                      key={module.title}
                      className="border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <Icon className="h-5 w-5 text-slate-800" />
                      <h3 className="mt-4 text-base font-semibold text-slate-950">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {module.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-b border-slate-200 pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('plattform.pillarsLabel')}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {pillars.map((pillar) => (
                <article key={pillar.id} className="border border-slate-200 bg-slate-50 px-4 py-4">
                  <h2 className="text-base font-semibold tracking-tight text-slate-950">
                    {t(pillar.titleKey as any)}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {t(pillar.bodyKey as any)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-950">
                    {t(pillar.bearerKey as any)}
                  </p>
                  {pillar.href && pillar.ctaKey ? (
                    <Link
                      href={localizeHref(locale, pillar.href)}
                      className="mt-4 inline-flex text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                    >
                      {t(pillar.ctaKey as any)}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-b border-slate-200 pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('plattform.closing.label')}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {t('plattform.closing.title')}
            </h2>
            <div className="max-w-3xl space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
              <p>{t('plattform.closing.paragraph1')}</p>
              <p>{t('plattform.closing.paragraph2')}</p>
              <p>{t('plattform.closing.paragraph3')}</p>
            </div>
          </section>

          <section className="border border-slate-200 bg-slate-50 px-4 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('plattform.nextStep.label')}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
              {t('plattform.nextStep.body')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={localizeHref(locale, '/?mode=signup&intent=create_register')}
                className="inline-flex min-h-11 items-center justify-center rounded-none border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {t('plattform.nextStep.primaryCta')}
              </Link>
              <a
                href={WHITEPAPER_HREF}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-none border border-slate-300 px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-white"
              >
                {t('plattform.nextStep.secondaryCta')}
              </a>
            </div>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}
