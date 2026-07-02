import type { Metadata } from 'next';

import ExperienceClient from './experience-client';

export const metadata: Metadata = {
  title: 'KI Register — Der Nachweis',
  description:
    'Vom verstreuten KI-Einsatz zum prüfbaren Nachweis. Eine Registerführung in vier Akten — nach EU AI Act.',
};

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ExperienceClient locale={locale} />;
}
