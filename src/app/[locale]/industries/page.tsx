import type { Metadata } from 'next';
import Link from 'next/link';
import { industries } from '@/data/industries';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'de'
    ? {
        title: 'Branchen – KI Register für EU AI Act Compliance',
        description:
          'EU AI Act Dokumentation für alle Branchen. Kostenlos, sofort einsatzbereit. Gesundheit, HR, Finanzen, Bildung, öffentlicher Sektor und mehr.',
      }
    : {
        title: 'Industries – AI Registry for EU AI Act Compliance',
        description:
          'EU AI Act documentation for every industry. Free, immediately ready. Healthcare, HR, Finance, Education, Public Sector and more.',
      };
}

export default async function IndustriesIndexPage({ params }: Props) {
  const { locale } = await params;
  const isDE = locale === 'de';

  const labels = {
    title: isDE ? 'Ihre Branche. Ihre Pflichten.' : 'Your industry. Your obligations.',
    subtitle: isDE
      ? 'Der EU AI Act gilt für alle – aber die Anforderungen variieren je nach Sektor. Wählen Sie Ihre Branche und erfahren Sie genau, was für Sie gilt.'
      : 'The EU AI Act applies to everyone — but requirements vary by sector. Choose your industry to see exactly what applies to you.',
    free: isDE
      ? 'Die gesamte Dokumentation ist dauerhaft kostenlos – keine Kreditkarte, kein Zeitlimit.'
      : 'All documentation is permanently free — no credit card, no time limit.',
    cta: isDE ? 'Mehr erfahren →' : 'Learn more →',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {labels.title}
          </h1>
          <p className="mb-4 max-w-2xl text-base leading-relaxed text-slate-600">{labels.subtitle}</p>
          <p className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {labels.free}
          </p>
        </div>
      </section>

      {/* Industry grid */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {industries.map((industry) => {
            const content = isDE ? industry.de : industry.en;
            const href = `/${locale}/industries/${industry.slug}`;
            return (
              <Link
                key={industry.slug}
                href={href}
                className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
              >
                <span className="text-3xl">{industry.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-slate-700">
                    {content.name}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{content.tagline}</p>
                  <p className="mt-3 text-xs font-medium text-slate-900">{labels.cta}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
