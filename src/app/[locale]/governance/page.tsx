import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  FileSearch,
  GraduationCap,
  Layers3,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { GOVERNANCE_VOLUME_TIERS } from '@/lib/billing/governance-volume-pricing';
import { localizeHref } from '@/lib/i18n/localize-href';

interface Props {
  params: Promise<{ locale: string }>;
}

const UPGRADE_HREF = '/settings?section=governance#upgrade-panel';
const REGISTER_SIGNUP_HREF = '/?mode=signup&intent=create_register';
const SALES_HREF =
  'mailto:zoltangal@web.de?subject=Governance%20Control%20Center';

const PRODUCT_IMAGE_SOURCES = [
  '/images/governance-register-overview-card.png',
  '/images/governance-use-case-detail-card.png',
  '/images/governance-use-case-pass-card.png',
] as const;

const iconSequence = [
  ShieldCheck,
  ListChecks,
  BarChart3,
  ClipboardCheck,
  FileSearch,
  FileArchive,
  GraduationCap,
  LockKeyhole,
];

function formatPrice(amountCents: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function getCopy(isGerman: boolean) {
  if (isGerman) {
    return {
      brand: 'KI Register',
      backHref: '/plattform',
      backLabel: 'Zur Plattform',
      kicker: 'Governance Control Center',
      title:
        'Die bezahlte Governance-Ebene für Organisationen, die KI-Einsatzfälle steuern, prüfen und exportieren müssen.',
      lead:
        'Das Free Register bleibt die Grundlage für Pflichtdokumentation, Use Case Pass und erste Nachweise. Das Governance Control Center bündelt viele Einsatzfälle zu Reviews, Richtlinien, Rollen, Audit-Spuren, Trust Portal, Exports und Academy auf Organisationsebene.',
      primaryCta: 'Governance freischalten',
      secondaryCta: 'Free Register starten',
      checkoutNote:
        'Der Checkout ermittelt nach Anmeldung automatisch die passende Stufe aus aktiven Usern und dokumentierten Einsatzfällen.',
      heroPanelLabel: 'Organisationssicht',
      heroPanelTitle: 'Aktuelle Governance-Lage',
      heroRows: [
        ['Reviews fällig', '7', 'Action Queue'],
        ['Policy-Lücken', '3', 'Policy Engine'],
        ['ISO-Fortschritt', '68%', 'Audit Layer'],
        ['Exportbereit', '4 Pakete', 'Dossier Center'],
      ],
      heroStatus: 'Bereit für Review-Rhythmus, Policy-Mapping und Export.',
      metrics: [
        'Volumenlogik in 5-User-Stufen',
        'Bis 200 dokumentierte Einsatzfälle',
        'Monatlich oder jährlich aktivierbar',
      ],
      pricingLabel: 'Verkaufsmodell',
      pricingTitle: 'Governance wächst mit der Organisation.',
      pricingIntro:
        'Die Stufe steigt in klaren Schritten: jeweils 5 zusätzliche User und 50 zusätzliche Einsatzfälle. Der serverseitige Stripe-Checkout wählt die passende Stufe anhand der aktuellen Workspace-Daten.',
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      volume: 'Volumen',
      users: 'User',
      useCases: 'Einsatzfälle',
      pricingFoot:
        'Ab 21 Usern oder 201 Einsatzfällen wird ein individueller Governance- oder Enterprise-Rahmen vereinbart.',
      contactCta: 'Größeren Rahmen anfragen',
      freeTitle: 'Was frei bleibt',
      paidTitle: 'Was Governance freischaltet',
      freeItems: [
        'Registereintrag und strukturierte Erfassung einzelner Einsatzfälle',
        'Use Case Pass als grundlegendes Nachweisobjekt',
        'Basisdaten zu Zweck, System, Owner, Risiko und Status',
        'Startpunkt für externe Informationen und interne Dokumentation',
      ],
      paidItems: [
        'Reviews, Action Queue und priorisierte Governance-Maßnahmen',
        'Policy Engine, ISO- und Audit-Layer, Export Center',
        'Trust Portal, Portfolio Intelligence und organisationsweite Lesbarkeit',
        'Academy-Zugriff und Kompetenzspur für Governance-Verantwortliche',
      ],
      operatingLabel: 'Arbeitsmodell',
      operatingTitle: 'Von einzelnen Einsatzfällen zur steuerbaren Organisation.',
      operatingIntro:
        'Governance arbeitet auf derselben Datenbasis wie das Register. Aus vielen Use Case Pässen entstehen Entscheidungen für Owner, Reviews, Richtlinien, Auditfähigkeit und externe Kommunikation.',
      operatingSteps: [
        {
          label: '1. Erfassen',
          title: 'Use Case Pass',
          body: 'Zweck, System, Owner, Risikoklasse, Material und Nachweisstatus entstehen am konkreten Einsatzfall.',
        },
        {
          label: '2. Priorisieren',
          title: 'Action Queue',
          body: 'Überfällige Reviews, fehlende Owner, offene Richtlinien und Audit-Lücken werden nach Dringlichkeit sortiert.',
        },
        {
          label: '3. Steuern',
          title: 'Control Center',
          body: 'Portfolio, Reifegrad, Rollen, Richtlinien, Academy und Trust Portal laufen in einer organisationsweiten Sicht zusammen.',
        },
        {
          label: '4. Exportieren',
          title: 'Audit-Dossier',
          body: 'Governance Report, ISO 42001 Dossier, Policy Bundle und Trust Bundle werden aus den Registerdaten ableitbar.',
        },
      ],
      modulesLabel: 'Was praktisch enthalten ist',
      stackTitle: 'Governance Stack',
      stackBody:
        'Registerdaten, Reviews, Policies, Audit und Academy bleiben in einer nachvollziehbaren Produktlogik verbunden.',
      modules: [
        {
          title: 'Governance Maturity Model',
          body: 'Deterministische Reifegradlogik für Dokumentation, Owner-Coverage, Review-Rhythmus, Policy-Mapping, Audit-Historie und ISO-Readiness.',
        },
        {
          title: 'Reviews / Action Queue',
          body: 'Eine priorisierte Aufgabenliste mit Deep Links in den betroffenen Einsatzfall und konkretem Bearbeitungsfokus.',
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
        {
          title: 'Academy & Art. 4 Spur',
          body: 'Lernfortschritt, Kurszugriff und Kompetenznachweis für Personen, die Governance-Verantwortung tragen.',
        },
        {
          title: 'Rollen- und Sicherheitsmodell',
          body: 'Workspace-Mitgliedschaft, Reviewer-Rollen, externe Officer und öffentliche Ansichten mit getrennten Berechtigungen.',
        },
      ],
      proofLabel: 'Datenbasis',
      proofTitle: 'Die Governance-Ebene baut auf echten Registerobjekten auf.',
      proofIntro:
        'Use Case Pass, Einsatzfalldaten und Statuslogik bleiben nachvollziehbar. Das Governance Control Center liest diese Struktur organisationsweit und macht daraus Review-, Policy- und Exportarbeit.',
      proofImages: [
        {
          title: 'Register als Ausgangspunkt',
          body: 'Einsatzfälle bleiben einzeln prüfbar und erhalten klare Verantwortlichkeiten.',
        },
        {
          title: 'Prüfbare Detailstruktur',
          body: 'Zweck, Risiko, Owner, Materialien und Review-Status werden im Arbeitsobjekt geführt.',
        },
        {
          title: 'Exportierbarer Nachweis',
          body: 'Der Use Case Pass wird zur lesbaren Grundlage für interne Ablage, Audit und Mandatsübergabe.',
        },
      ],
      securityTitle: 'Zugänge und Schutzlogik',
      securityLabel: 'Sicherheit',
      securityIntro:
        'Die Freischaltung nutzt bestehende Authentifizierung, Workspace-Mitgliedschaft und serverseitig geprüfte Stripe-Konfiguration. Öffentliche Formulare zeigen keine internen Governance-Ansichten.',
      securityItems: [
        'Checkout nur für angemeldete Nutzer:innen mit passendem Workspace-Kontext',
        'Stufe wird serverseitig aus aktiven Mitgliedern und Einsatzfällen berechnet',
        'Governance-Seiten prüfen Plan, Rolle und Workspace-Zugriff vor der Darstellung',
        'Trust Portal und externe Intake-Flows bleiben von internen Registeransichten getrennt',
      ],
      finalTitle: 'Bereit, Governance auf derselben Datenbasis zu führen?',
      finalBody:
        'Starten Sie mit dem Free Register oder schalten Sie Governance direkt in den Einstellungen frei. Der Checkout übernimmt Abrechnung, Rechnung und die passende Volumenstufe.',
      trainingCta: 'Fortbildung',
    };
  }

  return {
    brand: 'AI Registry',
    backHref: '/plattform',
    backLabel: 'Back to platform',
    kicker: 'Governance Control Centre',
    title:
      'The paid governance layer for organisations that need to steer, review and export AI use cases.',
    lead:
      'The Free Register remains the foundation for baseline documentation, Use Case Pass and first evidence. The Governance Control Centre bundles many use cases into reviews, policies, roles, audit trails, Trust Portal, exports and Academy at organisation level.',
    primaryCta: 'Unlock governance',
    secondaryCta: 'Start Free Register',
    checkoutNote:
      'After sign-in, Checkout automatically selects the correct tier from active users and documented use cases.',
    heroPanelLabel: 'Organisation view',
    heroPanelTitle: 'Current governance status',
    heroRows: [
      ['Reviews due', '7', 'Action Queue'],
      ['Policy gaps', '3', 'Policy Engine'],
      ['ISO progress', '68%', 'Audit Layer'],
      ['Export ready', '4 bundles', 'Dossier Center'],
    ],
    heroStatus: 'Ready for review cadence, policy mapping and export.',
    metrics: [
      'Volume logic in 5-user tiers',
      'Up to 200 documented use cases',
      'Monthly or annual activation',
    ],
    pricingLabel: 'Commercial model',
    pricingTitle: 'Governance scales with the organisation.',
    pricingIntro:
      'The tier rises in clear steps: 5 additional users and 50 additional use cases each. Server-side Stripe Checkout selects the right tier from the current workspace data.',
    monthly: 'Monthly',
    yearly: 'Annual',
    volume: 'Volume',
    users: 'Users',
    useCases: 'Use cases',
    pricingFoot:
      'From 21 users or 201 use cases, an individual governance or enterprise scope is agreed.',
    contactCta: 'Request larger scope',
    freeTitle: 'What remains free',
    paidTitle: 'What governance unlocks',
    freeItems: [
      'Registry entry and structured capture of individual use cases',
      'Use Case Pass as the baseline evidence object',
      'Core data for purpose, system, owner, risk and status',
      'Starting point for external information and internal documentation',
    ],
    paidItems: [
      'Reviews, Action Queue and prioritised governance actions',
      'Policy Engine, ISO and Audit Layer, Export Center',
      'Trust Portal, Portfolio Intelligence and organisation-level readability',
      'Academy access and competence trail for governance owners',
    ],
    operatingLabel: 'Operating model',
    operatingTitle: 'From individual use cases to a controllable organisation.',
    operatingIntro:
      'Governance works on the same data foundation as the registry. Many Use Case Passes become decisions for owners, reviews, policies, audit readiness and external communication.',
    operatingSteps: [
      {
        label: '1. Capture',
        title: 'Use Case Pass',
        body: 'Purpose, system, owner, risk class, materials and evidence status are created at the concrete use case.',
      },
      {
        label: '2. Prioritise',
        title: 'Action Queue',
        body: 'Overdue reviews, missing owners, open policies and audit gaps are ordered by urgency.',
      },
      {
        label: '3. Govern',
        title: 'Control Center',
        body: 'Portfolio, maturity, roles, policies, Academy and Trust Portal come together in an organisation-level view.',
      },
      {
        label: '4. Export',
        title: 'Audit Dossier',
        body: 'Governance Report, ISO 42001 Dossier, Policy Bundle and Trust Bundle become derivable from registry data.',
      },
    ],
    modulesLabel: 'What is practically included',
    stackTitle: 'Governance Stack',
    stackBody:
      'Registry data, reviews, policies, audit and Academy remain connected in one traceable product logic.',
    modules: [
      {
        title: 'Governance Maturity Model',
        body: 'Deterministic maturity logic for documentation, owner coverage, review cadence, policy mapping, audit history and ISO readiness.',
      },
      {
        title: 'Reviews / Action Queue',
        body: 'A prioritised task list with deep links into the affected use case and a concrete work focus.',
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
      {
        title: 'Academy & Article 4 trail',
        body: 'Learning progress, course access and competence evidence for people carrying governance responsibility.',
      },
      {
        title: 'Roles and security model',
        body: 'Workspace membership, reviewer roles, external officers and public views with separated permissions.',
      },
    ],
    proofLabel: 'Data foundation',
    proofTitle: 'The governance layer builds on real registry objects.',
    proofIntro:
      'Use Case Pass, use-case data and status logic remain traceable. The Governance Control Centre reads this structure across the organisation and turns it into review, policy and export work.',
    proofImages: [
      {
        title: 'Registry as starting point',
        body: 'Use cases remain individually reviewable and receive clear ownership.',
      },
      {
        title: 'Auditable detail structure',
        body: 'Purpose, risk, owner, materials and review status are maintained in the working object.',
      },
      {
        title: 'Exportable evidence',
        body: 'The Use Case Pass becomes the readable basis for internal filing, audit and client handover.',
      },
    ],
    securityTitle: 'Access and protection logic',
    securityLabel: 'Security',
    securityIntro:
      'Activation uses existing authentication, workspace membership and server-side checked Stripe configuration. Public forms do not show internal governance views.',
    securityItems: [
      'Checkout only for signed-in users with the right workspace context',
      'Tier is calculated server-side from active members and use cases',
      'Governance pages check plan, role and workspace access before rendering',
      'Trust Portal and external intake flows remain separated from internal registry views',
    ],
    finalTitle: 'Ready to run governance on the same data foundation?',
    finalBody:
      'Start with the Free Register or unlock governance directly in settings. Checkout handles billing, invoice and the correct volume tier.',
    trainingCta: 'Training',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'de') {
    return {
      title: 'Governance Control Center – KI Register',
      description:
        'Die bezahlte Governance-Ebene des KI Registers mit Reviews, Policy Engine, ISO- und Audit-Layer, Trust Portal, Exports und Volumenpreisen.',
    };
  }

  return {
    title: 'Governance Control Centre – AI Registry',
    description:
      'The paid governance layer of AI Registry with reviews, Policy Engine, ISO and Audit Layer, Trust Portal, exports and volume pricing.',
  };
}

export default async function GovernancePage({ params }: Props) {
  const { locale } = await params;
  const isGerman = locale === 'de';
  const copy = getCopy(isGerman);
  const upgradeHref = localizeHref(locale, UPGRADE_HREF);
  const signupHref = localizeHref(locale, REGISTER_SIGNUP_HREF);

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link
            href={localizeHref(locale, '/')}
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt={copy.brand}
              width={34}
              height={34}
              className="h-8 w-auto"
            />
            <span>{copy.brand}</span>
          </Link>
          <Link
            href={localizeHref(locale, copy.backHref)}
            className="text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
          >
            {copy.backLabel}
          </Link>
        </header>

        <section className="grid gap-8 border-b border-slate-200 pb-10 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-start">
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.kicker}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              {copy.lead}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={upgradeHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={signupHref}
                className="inline-flex min-h-11 items-center justify-center rounded-none border border-slate-300 px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
              >
                {copy.secondaryCta}
              </Link>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              {copy.checkoutNote}
            </p>
          </div>

          <aside className="border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.heroPanelLabel}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {copy.heroPanelTitle}
            </h2>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {copy.heroRows.map(([label, value, source]) => (
                <div
                  key={label}
                  className="grid grid-cols-[minmax(0,1fr)_90px] gap-3 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {label}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {source}
                    </p>
                  </div>
                  <p className="text-right text-xl font-semibold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {copy.heroStatus}
            </p>
          </aside>
        </section>

        <section className="grid gap-4 border-b border-slate-200 py-8 md:grid-cols-3">
          {copy.metrics.map((metric) => (
            <div key={metric} className="border border-slate-200 px-4 py-4">
              <p className="text-sm font-medium leading-6 text-slate-950">
                {metric}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.pricingLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.pricingTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700">
              {copy.pricingIntro}
            </p>
          </div>
          <div className="overflow-x-auto border border-slate-200">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    {copy.volume}
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    {copy.users}
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    {copy.useCases}
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    {copy.monthly}
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    {copy.yearly}
                  </th>
                </tr>
              </thead>
              <tbody>
                {GOVERNANCE_VOLUME_TIERS.map((tier) => (
                  <tr key={tier.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-4 font-medium text-slate-950">
                      {isGerman
                        ? `Bis ${tier.maxUsers} / ${tier.maxUseCases}`
                        : `Up to ${tier.maxUsers} / ${tier.maxUseCases}`}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {tier.maxUsers}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {tier.maxUseCases}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {formatPrice(tier.monthlyAmountCents, locale)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {formatPrice(tier.yearlyAmountCents, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-slate-700">
                {copy.pricingFoot}
              </p>
              <a
                href={SALES_HREF}
                className="inline-flex min-h-10 items-center justify-center rounded-none border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                {copy.contactCta}
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-5 border-b border-slate-200 py-10 lg:grid-cols-2">
          {[
            { title: copy.freeTitle, items: copy.freeItems },
            { title: copy.paidTitle, items: copy.paidItems },
          ].map((section) => (
            <article key={section.title} className="border border-slate-200 px-5 py-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-7 text-slate-700"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-800" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="space-y-6 border-b border-slate-200 py-10">
          <div className="max-w-4xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.operatingLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.operatingTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700 sm:text-base">
              {copy.operatingIntro}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.operatingSteps.map((step) => (
              <article key={step.label} className="border border-slate-200 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {step.label}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.modulesLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.stackTitle}
            </h2>
            <div className="border-l-2 border-slate-300 pl-4 text-sm leading-7 text-slate-700">
              <Layers3 className="mb-3 h-5 w-5 text-slate-800" />
              {copy.stackBody}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {copy.modules.map((module, index) => {
              const Icon = iconSequence[index] ?? ShieldCheck;

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
        </section>

        <section className="space-y-6 border-b border-slate-200 py-10">
          <div className="max-w-4xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.proofLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.proofTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700 sm:text-base">
              {copy.proofIntro}
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {copy.proofImages.map((item, index) => (
              <figure
                key={item.title}
                className="overflow-hidden border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-200 bg-slate-50 p-3">
                  <Image
                    src={
                      PRODUCT_IMAGE_SOURCES[index] ?? PRODUCT_IMAGE_SOURCES[0]
                    }
                    alt=""
                    width={1180}
                    height={760}
                    className="h-auto w-full border border-slate-200 bg-white"
                    loading="lazy"
                    unoptimized
                  />
                </div>
                <figcaption className="px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {item.body}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 lg:grid-cols-[330px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.securityLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.securityTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700">
              {copy.securityIntro}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.securityItems.map((item) => (
              <div key={item} className="flex gap-3 border border-slate-200 px-4 py-4">
                <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-slate-800" />
                <p className="text-sm leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-slate-800" />
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {copy.finalTitle}
              </h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              {copy.finalBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={upgradeHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={localizeHref(locale, '/fortbildung')}
              className="inline-flex min-h-11 items-center justify-center rounded-none border border-slate-300 px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
            >
              {copy.trainingCta}
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
