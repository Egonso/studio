'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { localizeHref } from '@/lib/i18n/localize-href';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

export default function PlattformPageClient() {
  const locale = useLocale();
  const t = useTranslations();

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
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6">
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
