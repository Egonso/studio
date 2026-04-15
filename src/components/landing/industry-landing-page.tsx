import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import type { IndustryLocaleContent, IndustryUseCase } from '@/data/industries';
import { localizeHref } from '@/lib/i18n/localize-href';

const RISK_TEXT_CLASS: Record<IndustryUseCase['risk'], string> = {
  high: 'text-slate-900 font-medium',
  limited: 'text-slate-700',
  minimal: 'text-slate-500',
  prohibited: 'text-slate-900 font-medium',
};

interface IndustryLandingPageProps {
  content: IndustryLocaleContent;
  locale: string;
  appName: string;
  registerHref: string;
}

export async function IndustryLandingPage({
  content,
  locale,
  appName,
  registerHref,
}: IndustryLandingPageProps) {
  const t = await getTranslations('industries');
  const isGerman = locale === 'de';
  const primaryCta = content.cta ?? {
    label: t('register'),
    href: registerHref,
  };
  const isExternalCta = !primaryCta.href.startsWith('/');
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={localizeHref(locale, '/')}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
          >
            <ThemeAwareLogo alt={appName} width={28} height={28} className="h-6 w-auto" />
          </Link>
          <Link
            href={localizeHref(locale, '/')}
            className="text-[13px] text-slate-400 transition-colors hover:text-slate-900"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>

      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {content.objectLabel ?? (isGerman ? 'Branchen-Dokument' : 'Industry document')}
          </p>
          <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {content.name}
          </h1>
          <p className="mb-4 text-[15px] text-slate-500">{content.tagline}</p>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-700">
            {content.heroDescription}
          </p>

          <div className="mt-8 grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {isGerman ? 'Einordnung' : 'Classification'}
              </p>
              <p className="mt-2 text-sm text-slate-950">
                {content.stanceLabel ?? (isGerman ? 'Branchenübersicht' : 'Industry overview')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t('euActRiskLevel')}
              </p>
              <p className="mt-2 text-sm text-slate-950">{content.euActRiskLevel}</p>
              <p className="mt-1 text-[13px] text-slate-500">{content.euActRiskDetail}</p>
            </div>
            {content.effectiveDate ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isGerman ? 'Stand der Rechtslage' : 'Effective legal position'}
                </p>
                <p className="mt-2 text-sm text-slate-950">{content.effectiveDate}</p>
              </div>
            ) : null}
            {content.lastSubstantiveUpdate ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isGerman ? 'Letzte inhaltliche Aktualisierung' : 'Last substantive update'}
                </p>
                <p className="mt-2 text-sm text-slate-950">{content.lastSubstantiveUpdate}</p>
              </div>
            ) : null}
            {content.author ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isGerman ? 'Autor' : 'Author'}
                </p>
                <p className="mt-2 text-sm text-slate-950">{content.author}</p>
              </div>
            ) : null}
            {content.reviewedBy ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isGerman ? 'Geprüft durch' : 'Reviewed by'}
                </p>
                <p className="mt-2 text-sm text-slate-950">{content.reviewedBy}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

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

      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
            {t('typicalUseCases')}
          </h2>
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {content.typicalUseCases.map((uc, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-[14px] text-slate-800">{uc.name}</span>
                <span className={`shrink-0 text-[12px] ${RISK_TEXT_CLASS[uc.risk]}`}>
                  {t(`riskLabels.${uc.risk}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {content.sourceUrls?.length ? (
        <section className="border-b border-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
              {isGerman ? 'Quellen' : 'Sources'}
            </h2>
            <div className="space-y-3 border border-slate-200 px-4 py-4">
              {content.sourceUrls.map((sourceUrl) => (
                <a
                  key={sourceUrl}
                  className="block text-[13px] leading-6 text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-950"
                  href={sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceUrl}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {content.relatedLinks?.length ? (
        <section className="border-b border-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-xs uppercase tracking-[0.08em] text-slate-400">
              {isGerman ? 'Verwandte Dokumente' : 'Related documents'}
            </h2>
            <div className="space-y-4 border border-slate-200 px-4 py-4">
              {content.relatedLinks.map((link) => (
                <div key={`${link.label}-${link.href}`} className="space-y-1">
                  <Link
                    href={link.href}
                    className="text-[14px] font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                  >
                    {link.label}
                  </Link>
                  {link.description ? (
                    <p className="text-[13px] leading-6 text-slate-600">{link.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="border border-slate-200 bg-white px-4 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {isGerman ? 'Nächster Schritt' : 'Next step'}
            </p>
            <div className="mt-3 space-y-2">
              {isExternalCta ? (
                <a
                  href={primaryCta.href}
                  className="inline-flex items-center text-[14px] font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                >
                  {primaryCta.label}
                </a>
              ) : (
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center text-[14px] font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                >
                  {primaryCta.label}
                </Link>
              )}
              {primaryCta.description ? (
                <p className="text-[13px] leading-relaxed text-slate-600">{primaryCta.description}</p>
              ) : (
                <p className="text-[13px] leading-relaxed text-slate-600">{t('freeNote')}</p>
              )}
            </div>
          </div>
        </div>
      </section>

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

      <section>
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-[12px] text-slate-400">
            {`© ${year} ${appName} – ZukunftBilden GmbH & BewusstseinBilden UG (haftungsbeschränkt)`}
          </p>
        </div>
      </section>
    </div>
  );
}
