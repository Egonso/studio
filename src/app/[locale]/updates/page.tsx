import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicDocumentIndexPage } from '@/components/public-documents/public-document-index-page';
import { getPublicDocumentCollectionCopy, getPublicDocumentsByType } from '@/lib/public-documents';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'de') {
    return {};
  }

  const copy = getPublicDocumentCollectionCopy('update', locale);
  return {
    title: `${copy.title} | KI-Register`,
    description: copy.description,
  };
}

export default async function UpdatesPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'de') {
    notFound();
  }

  const documents = getPublicDocumentsByType('update', locale);
  return (
    <PublicDocumentIndexPage
      contentType="update"
      documents={documents}
      locale={locale}
    />
  );
}
