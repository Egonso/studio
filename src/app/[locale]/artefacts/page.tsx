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

  const copy = getPublicDocumentCollectionCopy('artefact', locale);
  return {
    title: `${copy.title} | KI-Register`,
    description: copy.description,
  };
}

export default async function ArtefactsPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'de') {
    notFound();
  }

  const documents = getPublicDocumentsByType('artefact', locale);
  return (
    <PublicDocumentIndexPage
      contentType="artefact"
      documents={documents}
      locale={locale}
    />
  );
}
