import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { industries } from '@/data/industries';
import { localizeHref } from '@/lib/i18n/localize-href';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'industries' });
  return {
    title: t('allTitle'),
    description: t('allSubtitle'),
  };
}

export default async function IndustriesIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('industries');
  const metadataT = await getTranslations({ locale, namespace: 'metadata' });

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav with logo */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={localizeHref(locale, '/')}
            className="inline-flex transition-opacity hover:opacity-70"
          >
            <ThemeAwareLogo
              alt={metadataT('appName')}
              width={28}
              height={28}
              className="h-6 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Header */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
            {t('allTitle')}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
            {t('allSubtitle')}
          </p>
        </div>
      </section>

      {/* Industry list */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
          {industries.map((industry) => {
            const content = locale === 'de' ? industry.de : industry.en;
            const href = `/${locale}/industries/${industry.slug}`;
            return (
              <Link
                key={industry.slug}
                href={href}
                className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-slate-900">{content.name}</p>
                  <p className="mt-0.5 text-[13px] text-slate-500">{content.euActRiskLevel}</p>
                </div>
                <span className="shrink-0 text-[12px] text-slate-400">{t('learnMore')}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
