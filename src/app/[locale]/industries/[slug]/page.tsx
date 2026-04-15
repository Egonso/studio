import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { IndustryLandingPage } from '@/components/landing/industry-landing-page';
import { StructuredData } from '@/components/public-documents/structured-data';
import { industries, getIndustryBySlug } from '@/data/industries';
import { localizeHref } from '@/lib/i18n/localize-href';
import { getPublicSiteOrigin, PUBLIC_ORGANIZATION } from '@/lib/public-site';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const industry of industries) {
    params.push({ locale: 'en', slug: industry.slug });
    params.push({ locale: 'de', slug: industry.slug });
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) return {};
  const content = locale === 'de' ? industry.de : industry.en;
  return {
    title: content.metaTitle,
    description: content.metaDescription,
  };
}

export default async function IndustryPage({ params }: Props) {
  const { locale, slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) notFound();

  const content = locale === 'de' ? industry.de : industry.en;
  const registerHref = localizeHref(locale, '/');
  const metadataT = await getTranslations({ locale, namespace: 'metadata' });
  const pageUrl = `${getPublicSiteOrigin()}/${locale}/industries/${industry.slug}`;
  const structuredData: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.metaTitle,
      description: content.metaDescription,
      dateModified: content.lastSubstantiveUpdate ?? '2026-04-15',
      datePublished: content.effectiveDate ?? '2026-04-15',
      author: {
        '@type': 'Organization',
        name: content.author ?? PUBLIC_ORGANIZATION.name,
      },
      publisher: {
        '@type': 'Organization',
        name: PUBLIC_ORGANIZATION.name,
        email: PUBLIC_ORGANIZATION.email,
      },
      mainEntityOfPage: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: locale === 'de' ? 'Branchen' : 'Industries',
          item: `${getPublicSiteOrigin()}/${locale}/industries`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: content.name,
          item: pageUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: PUBLIC_ORGANIZATION.name,
      email: PUBLIC_ORGANIZATION.email,
      url: getPublicSiteOrigin(),
    },
  ];

  if (content.faq.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  return (
    <>
      <StructuredData payload={structuredData} />
      <IndustryLandingPage
        content={content}
        locale={locale}
        appName={metadataT('appName')}
        registerHref={registerHref}
      />
    </>
  );
}
