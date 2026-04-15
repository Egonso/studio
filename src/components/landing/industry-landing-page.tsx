import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { IndustryLocaleContent, IndustryUseCase } from '@/data/industries';

const RISK_TEXT_CLASS: Record<IndustryUseCase['risk'], string> = {
  high: 'text-slate-900 font-medium',
  limited: 'text-slate-700',
  minimal: 'text-slate-500',
  prohibited: 'text-slate-900 font-medium',
};

interface IndustryLandingPageProps {
  content: IndustryLocaleContent;
  registerHref: string;
}

export async function IndustryLandingPage({ content, registerHref }: IndustryLandingPageProps) {
  const t = await getTranslations('industries');

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-[13px] text-slate-500 transition-colors hover:text-slate-900"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>

      {/* Header */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
            {content.name}
          </h1>
          <p className="mb-4 text-[15px] text-slate-500">{content.tagline}</p>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-700">
            {content.heroDescription}
          </p>

          {/* Risk level — plain bordered block, no color */}
          <div className="mt-8 rounded-md border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
              {t('euActRiskLevel')}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">{content.euActRiskLevel}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">{content.euActRiskDetail}</p>
          </div>
        </div>
      </section>

      {/* Why affected */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
            {t('whyAffected')}
          </h2>
          <ol className="space-y-3">
            {content.whyAffected.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-[11px] font-medium tabular-nums text-slate-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] leading-relaxed text-slate-700">{point}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Typical use cases */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
            {t('typicalUseCases')}
          </h2>
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {content.typicalUseCases.map((uc, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-[14px] text-slate-800">{uc.name}</span>
                <span className={`shrink-0 text-[12px] ${RISK_TEXT_CLASS[uc.risk]}`}>
                  {t(`riskLabels.${uc.risk}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Obligations */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
            {t('obligations')}
          </h2>
          <ul className="space-y-2">
            {content.obligations.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-slate-700">
                <span className="mt-1 shrink-0 text-slate-300">—</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Register CTA — minimal, inline, no colored blocks */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-5">
            <p className="text-[13px] leading-relaxed text-slate-600">{t('freeNote')}</p>
            <div className="mt-4">
              <Link
                href={registerHref}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {t('register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">{t('faq')}</h2>
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {content.faq.map((item, i) => (
              <div key={i} className="px-4 py-4">
                <p className="text-[14px] font-medium text-slate-900">{item.q}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-[12px] text-slate-400">
            ZukunftBilden GmbH &amp; BewusstseinBilden UG — {content.name}
          </p>
        </div>
      </section>
    </div>
  );
}
