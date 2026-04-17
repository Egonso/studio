import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PlattformPageClient from './plattform-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t('plattform.metadata.title'),
    description: t('plattform.metadata.description'),
  };
}

export default function PlattformPage() {
  return <PlattformPageClient />;
}
