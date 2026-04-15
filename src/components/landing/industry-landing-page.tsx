import Link from 'next/link';
import type { IndustryLocaleContent, IndustryUseCase } from '@/data/industries';

const RISK_CONFIG = {
  high: {
    label: { de: 'Hochrisiko', en: 'High-Risk' },
    className: 'bg-red-100 text-red-800 border border-red-200',
    dot: 'bg-red-500',
  },
  limited: {
    label: { de: 'Begrenztes Risiko', en: 'Limited Risk' },
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
    dot: 'bg-amber-500',
  },
  minimal: {
    label: { de: 'Minimales Risiko', en: 'Minimal Risk' },
    className: 'bg-green-100 text-green-800 border border-green-200',
    dot: 'bg-green-500',
  },
  prohibited: {
    label: { de: 'Verboten', en: 'Prohibited' },
    className: 'bg-slate-900 text-white border border-slate-800',
    dot: 'bg-slate-900',
  },
} as const;

function RiskBadge({ risk, locale }: { risk: IndustryUseCase['risk']; locale: string }) {
  const cfg = RISK_CONFIG[risk];
  const label = locale === 'de' ? cfg.label.de : cfg.label.en;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
}

interface IndustryLandingPageProps {
  locale: string;
  icon: string;
  content: IndustryLocaleContent;
  registerHref: string;
}

export function IndustryLandingPage({ locale, icon, content, registerHref }: IndustryLandingPageProps) {
  const isDE = locale === 'de';

  const labels = {
    riskLevel: isDE ? 'EU AI Act Risikostufe' : 'EU AI Act Risk Level',
    whyAffected: isDE ? 'Warum betrifft das Ihre Branche?' : 'Why does this affect your industry?',
    typicalUseCases: isDE ? 'Typische KI-Einsatzfälle' : 'Typical AI Use Cases',
    obligations: isDE ? 'Ihre Dokumentationspflichten' : 'Your Documentation Obligations',
    faq: isDE ? 'Häufige Fragen' : 'Frequently Asked Questions',
    cta: isDE ? 'Jetzt kostenlos registrieren' : 'Register for free now',
    ctaSub: isDE
      ? 'Keine Kreditkarte. Kein Zeitlimit. Alle KI-Einsatzfälle dokumentieren.'
      : 'No credit card. No time limit. Document all AI use cases.',
    freeLabel: isDE ? 'Dauerhaft kostenlos' : 'Permanently free',
    backToHome: isDE ? '← Zurück zur Startseite' : '← Back to home',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav breadcrumb */}
      <div className="border-b border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
            {labels.backToHome}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-4 text-5xl">{icon}</div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.name}
          </h1>
          <p className="mb-6 text-lg font-medium text-slate-600">{content.tagline}</p>
          <p className="max-w-2xl text-base leading-relaxed text-slate-700">{content.heroDescription}</p>

          {/* Risk level callout */}
          <div className="mt-8 inline-flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">{labels.riskLevel}</p>
              <p className="mt-0.5 text-lg font-bold text-red-900">{content.euActRiskLevel}</p>
              <p className="mt-0.5 text-sm text-red-700">{content.euActRiskDetail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why affected */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">{labels.whyAffected}</h2>
          <ul className="space-y-3">
            {content.whyAffected.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Typical use cases */}
      <section className="border-b border-slate-100 bg-slate-50/40">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">{labels.typicalUseCases}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.typicalUseCases.map((uc, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-sm leading-snug text-slate-800">{uc.name}</span>
                <RiskBadge risk={uc.risk} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Obligations */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">{labels.obligations}</h2>
          <ul className="space-y-3">
            {content.obligations.map((obligation, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="leading-relaxed">{obligation}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-slate-100 bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            {labels.freeLabel}
          </div>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{labels.cta}</h2>
          <p className="mb-8 text-slate-400">{labels.ctaSub}</p>
          <Link
            href={registerHref}
            className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100"
          >
            {labels.cta}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-xl font-semibold text-slate-900">{labels.faq}</h2>
          <div className="space-y-6">
            {content.faq.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4">
                <p className="mb-2 font-semibold text-slate-900">{item.q}</p>
                <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer nudge */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            {isDE
              ? 'KI Register ist ein Produkt von ZukunftBilden GmbH & BewusstseinBilden UG — Datenhaltung in der EU.'
              : 'AI Registry is a product of ZukunftBilden GmbH & BewusstseinBilden UG — data stored in the EU.'}
          </p>
        </div>
      </section>
    </div>
  );
}
