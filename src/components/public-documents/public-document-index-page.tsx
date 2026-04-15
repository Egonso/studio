import Link from 'next/link';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import {
  getPublicDocumentCollectionCopy,
  getPublicDocumentHref,
  getPublicDocumentTypeLabel,
  type PublicDocument,
} from '@/lib/public-documents';

interface PublicDocumentIndexPageProps {
  locale: string;
  contentType: PublicDocument['content_type'];
  documents: PublicDocument[];
}

function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PublicDocumentIndexPage({
  locale,
  contentType,
  documents,
}: PublicDocumentIndexPageProps) {
  const collection = getPublicDocumentCollectionCopy(contentType, locale);
  const isGerman = locale === 'de';
  const appName = isGerman ? 'KI Register' : 'AI Registry';
  const referenceLabel = isGerman ? 'Öffentliche Referenz' : 'Public reference';
  const relevanceLabel = isGerman ? 'Relevant für' : 'Relevant for';
  const effectiveLabel = isGerman ? 'Stand der Rechtslage' : 'Effective legal position';
  const updatedLabel = isGerman ? 'Aktualisiert' : 'Updated';
  const downloadsLabel = isGerman ? 'Downloads verfügbar' : 'downloads available';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
            >
              <ThemeAwareLogo alt={appName} width={28} height={28} className="h-7 w-auto" />
              <span>{appName}</span>
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {referenceLabel}
            </p>
          </div>
        </header>

        <section className="border-b border-slate-200 py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {getPublicDocumentTypeLabel(contentType, locale)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {collection.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            {collection.description}
          </p>
        </section>

        <section className="py-8">
          <div className="divide-y divide-slate-200 border border-slate-200">
            {documents.map((doc) => (
              <article key={`${doc.locale}-${doc.content_type}-${doc.slug}`} className="px-4 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {doc.object_label}
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                      <Link
                        href={getPublicDocumentHref(doc)}
                        className="underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                      >
                        {doc.title}
                      </Link>
                    </h2>
                    <p className="text-[15px] leading-7 text-slate-700">{doc.summary}</p>
                    {doc.downloads.length > 0 ? (
                      <p className="text-[13px] font-medium text-slate-500">
                        {doc.downloads.length} {downloadsLabel}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-[210px] space-y-2 border border-slate-200 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {relevanceLabel}
                    </p>
                    <p className="text-sm text-slate-950">{doc.stance_label}</p>
                    <p className="text-sm leading-6 text-slate-600">
                      {doc.audiences.slice(0, 2).join(' · ')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {effectiveLabel}: {formatDate(doc.effective_date, locale)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {updatedLabel}: {formatDate(doc.last_substantive_update, locale)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
