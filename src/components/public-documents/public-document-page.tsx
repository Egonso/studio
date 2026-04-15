import Link from 'next/link';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import {
  getPublicDocumentCollectionCopy,
  getPublicDocumentTypeLabel,
  type PublicDocument,
  type PublicDocumentLink,
} from '@/lib/public-documents';
import { localizeHref } from '@/lib/i18n/localize-href';

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

function renderLink(link: PublicDocumentLink, locale: string) {
  const isInternal = link.href.startsWith('/');

  if (isInternal) {
    return (
      <Link
        href={localizeHref(locale, link.href)}
        className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
      >
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
      rel="noreferrer"
      target="_blank"
    >
      {link.label}
    </a>
  );
}

interface PublicDocumentPageProps {
  document: PublicDocument;
}

export function PublicDocumentPage({ document }: PublicDocumentPageProps) {
  const collection = getPublicDocumentCollectionCopy(document.content_type, document.locale);
  const isGerman = document.locale === 'de';
  const appName = isGerman ? 'KI Register' : 'AI Registry';
  const publicReferenceLabel = isGerman ? 'Öffentliche Referenz' : 'Public reference';
  const reviewerLabel = isGerman ? 'Geprüft durch' : 'Reviewed by';
  const collectionHref = `/${document.locale}/${document.content_type === 'standard' ? 'standards' : document.content_type === 'update' ? 'updates' : 'artefacts'}`;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/${document.locale}`}
              className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
            >
              <ThemeAwareLogo alt={appName} width={28} height={28} className="h-7 w-auto" />
              <span>{appName}</span>
            </Link>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {publicReferenceLabel}
              </p>
              <Link
                href={collectionHref}
                className="mt-1 inline-flex text-[13px] text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900"
              >
                {collection.title}
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <article className="space-y-10">
            <section className="space-y-5 border-b border-slate-200 pb-8">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {document.object_label}
                </p>
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {document.title}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600">
                  {document.summary}
                </p>
              </div>

              <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isGerman ? 'Dokumenttyp' : 'Document type'}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">
                    {getPublicDocumentTypeLabel(document.content_type, document.locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isGerman ? 'Einordnung' : 'Classification'}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">{document.stance_label}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isGerman ? 'Stand der Rechtslage' : 'Effective legal position'}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">{formatDate(document.effective_date, document.locale)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isGerman ? 'Letzte inhaltliche Aktualisierung' : 'Last substantive update'}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">
                    {formatDate(document.last_substantive_update, document.locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isGerman ? 'Autor' : 'Author'}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">{document.author}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {reviewerLabel}
                  </p>
                  <p className="mt-2 text-sm text-slate-950">{document.reviewed_by}</p>
                </div>
              </div>
            </section>

            {document.sections.map((section) => (
              <section key={section.heading} className="space-y-4 border-b border-slate-200 pb-8">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {section.heading}
                </h2>

                {section.kind === 'paragraphs' ? (
                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-[15px] leading-8 text-slate-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                {section.kind === 'bullets' ? (
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[15px] leading-8 text-slate-700">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.kind === 'table' ? (
                  <div className="overflow-hidden border border-slate-200">
                    {section.rows.map((row) => (
                      <div
                        key={`${row.label}-${row.value}`}
                        className="grid gap-2 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {row.label}
                        </p>
                        <p className="text-[14px] leading-7 text-slate-700">{row.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            {document.faq.length > 0 ? (
              <section className="space-y-4 border-b border-slate-200 pb-8">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">FAQ</h2>
                <div className="divide-y divide-slate-200 border border-slate-200">
                  {document.faq.map((item) => (
                    <div key={item.q} className="px-4 py-4">
                      <p className="text-[14px] font-medium text-slate-950">{item.q}</p>
                      <p className="mt-2 text-[14px] leading-7 text-slate-700">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {document.cta ? (
              <section className="border border-slate-200 px-4 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isGerman ? 'Nächster Schritt' : 'Next step'}
                </p>
                <div className="mt-3 space-y-2">
                  {renderLink(document.cta, document.locale)}
                  {document.cta.description ? (
                    <p className="text-sm leading-7 text-slate-600">{document.cta.description}</p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="space-y-6">
            <section className="border border-slate-200 px-4 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {isGerman ? 'Quellen' : 'Sources'}
              </p>
              <div className="mt-4 space-y-3">
                {document.source_urls.map((sourceUrl) => (
                  <a
                    key={sourceUrl}
                    className="block text-sm leading-6 text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-950"
                    href={sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {sourceUrl}
                  </a>
                ))}
              </div>
            </section>

            {document.related_links.length > 0 ? (
              <section className="border border-slate-200 px-4 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {isGerman ? 'Verwandte Dokumente' : 'Related documents'}
                </p>
                <div className="mt-4 space-y-4">
                  {document.related_links.map((link) => (
                    <div key={`${link.label}-${link.href}`} className="space-y-1">
                      {renderLink(link, document.locale)}
                      {link.description ? (
                        <p className="text-sm leading-6 text-slate-600">{link.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border border-slate-200 px-4 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {isGerman ? 'Sammlungslogik' : 'Collection logic'}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{collection.description}</p>
              <div className="mt-4 space-y-2">
                <Link
                  href={collectionHref}
                  className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                >
                  Alle {collection.title.toLowerCase()} anzeigen
                </Link>
                <Link
                  href={`/${document.locale}/law`}
                  className="block text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                >
                  {isGerman ? 'Zum Rechtstext-Kontext' : 'Legal text context'}
                </Link>
                <Link
                  href={`/${document.locale}/verify`}
                  className="block text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                >
                  {isGerman ? 'Öffentliche Verifikation' : 'Public verification'}
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
