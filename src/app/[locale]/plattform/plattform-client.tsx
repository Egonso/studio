'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { localizeHref } from '@/lib/i18n/localize-href';

const CONTACT_MAILTO = 'mailto:office@momofeichtinger.com';

export default function PlattformPageClient() {
  const locale = useLocale();
  const t = useTranslations();

  const pillars: Array<{ id: string; titleKey: string; bodyKey: string; bearerKey: string }> = [
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
    },
  ];

  return (
    <MarketingShell>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        <div className="mb-10 flex items-center gap-3">
          <Link
            href={localizeHref(locale, '/')}
            className="flex items-center gap-3 text-base font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt={t('metadata.appName')}
              width={34}
              height={34}
              className="h-8 w-auto"
            />
            <span>{t('metadata.appName')}</span>
          </Link>
        </div>

        <section className="space-y-4 pb-10">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            {t('plattform.title')}
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            {t('plattform.subtitle')}
          </p>
        </section>

        <section className="pb-12">
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            {t('plattform.lead')}
          </p>
        </section>

        <section className="space-y-10 border-t border-slate-200 pt-10">
          {pillars.map((pillar) => (
            <article key={pillar.id} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {t(pillar.titleKey as any)}
              </h2>
              <p className="text-base leading-7 text-slate-600">
                {t(pillar.bodyKey as any)}
              </p>
              <p className="text-sm leading-6 text-slate-500">
                {t(pillar.bearerKey as any)}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12 space-y-4 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {t('plattform.closing.title')}
          </h2>
          <p className="text-base leading-7 text-slate-600">
            {t('plattform.closing.paragraph1')}
          </p>
          <p className="text-base leading-7 text-slate-600">
            {t('plattform.closing.paragraph2')}
          </p>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-8 pb-16">
          <p className="text-sm leading-6 text-slate-500">
            {t('plattform.contact.prefix')}{' '}
            <a
              href={CONTACT_MAILTO}
              className="text-slate-950 underline underline-offset-4 hover:opacity-75"
            >
              {t('plattform.contact.link')}
            </a>
          </p>
        </section>
      </main>
    </MarketingShell>
  );
}
