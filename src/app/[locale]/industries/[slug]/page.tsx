import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IndustryLandingPage } from '@/components/landing/industry-landing-page';
import { industries, getIndustryBySlug } from '@/data/industries';

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
  const registerHref = locale === 'de' ? '/de' : '/en';

  return (
    <IndustryLandingPage
      content={content}
      registerHref={registerHref}
    />
  );
}
