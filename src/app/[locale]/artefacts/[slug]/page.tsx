import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicDocumentPage } from '@/components/public-documents/public-document-page';
import { StructuredData } from '@/components/public-documents/structured-data';
import {
  getPublicDocument,
  getPublicDocumentHref,
  getPublicDocumentsByType,
} from '@/lib/public-documents';
import { getPublicSiteOrigin, PUBLIC_ORGANIZATION } from '@/lib/public-site';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

function buildStructuredData(locale: string, slug: string) {
  const document = getPublicDocument('artefact', slug, locale);
  if (!document) {
    return null;
  }

  const pageUrl = `${getPublicSiteOrigin()}${getPublicDocumentHref(document)}`;
  const payload: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: document.title,
      description: document.summary,
      dateModified: document.last_substantive_update,
      datePublished: document.effective_date,
      author: {
        '@type': 'Organization',
        name: document.author,
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
          name: 'Artefacts',
          item: `${getPublicSiteOrigin()}/${locale}/artefacts`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: document.title,
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

  if (document.schema_types.includes('Dataset')) {
    payload.push({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: document.title,
      description: document.summary,
      creator: {
        '@type': 'Organization',
        name: PUBLIC_ORGANIZATION.name,
      },
      url: pageUrl,
    });
  }

  return payload;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const document = getPublicDocument('artefact', slug, locale);
  if (!document) {
    return {};
  }

  return {
    title: `${document.title} | KI-Register`,
    description: document.summary,
  };
}

export async function generateStaticParams() {
  return getPublicDocumentsByType('artefact', 'de').map((document) => ({
    locale: document.locale,
    slug: document.slug,
  }));
}

export default async function ArtefactDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const document = getPublicDocument('artefact', slug, locale);
  if (!document) {
    notFound();
  }

  const structuredData = buildStructuredData(locale, slug);

  return (
    <>
      {structuredData ? <StructuredData payload={structuredData} /> : null}
      <PublicDocumentPage document={document} />
    </>
  );
}
