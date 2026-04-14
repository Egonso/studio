'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  ExternalLink,
  FileDown,
  Loader2,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';

interface PublicCertificate {
  certificateCode: string;
  certificateId: string;
  holderName: string;
  company: string | null;
  issuedDate: string;
  validUntil: string | null;
  status: 'active' | 'expired' | 'revoked';
  modules: string[];
  verifyUrl: string;
  latestDocumentUrl: string | null;
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Nicht gesetzt';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function VerificationPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<PublicCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      return;
    }

    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certification/public/${encodeURIComponent(code)}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Zertifikat nicht gefunden oder ungültig.'
              : 'Fehler bei der Überprüfung.',
          );
        }

        const payload = await response.json();
        setCertificate(payload as PublicCertificate);
      } catch (fetchError) {
        console.error('Verification error:', fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Fehler bei der Überprüfung. Bitte versuchen Sie es später erneut.',
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchCertificate();
  }, [code]);

  const statusMeta = useMemo(() => {
    switch (certificate?.status) {
      case 'expired':
        return {
          title: 'Abgelaufenes Zertifikat',
          label: 'Abgelaufen',
          body: 'Dieses Zertifikat ist historisch nachvollziehbar, aber nicht mehr aktuell gültig.',
          tone: 'muted',
        } as const;
      case 'revoked':
        return {
          title: 'Widerrufenes Zertifikat',
          label: 'Widerrufen',
          body: 'Dieses Zertifikat wurde widerrufen und darf nicht mehr als aktueller Nachweis verwendet werden.',
          tone: 'outlined',
        } as const;
      default:
        return {
          title: 'Gültiges Zertifikat',
          label: 'Aktiv',
          body: 'Dieses Zertifikat bestätigt die erfolgreiche Kompetenzprüfung im KI-Register.',
          tone: 'solid',
        } as const;
    }
  }, [certificate?.status]);

  const statusBadgeClass =
    statusMeta.tone === 'solid'
      ? 'bg-slate-950 text-white border-slate-950'
      : statusMeta.tone === 'muted'
        ? 'bg-slate-200 text-slate-950 border-slate-300'
        : 'bg-white text-slate-950 border-slate-950';

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-12 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt="KI-Register"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>KI-Register</span>
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Öffentliche Verifikation
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center border border-slate-200 bg-white px-6 py-12">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifiziere Zertifikat...
            </div>
          </div>
        ) : error || !certificate ? (
          <div className="border border-slate-200 bg-white p-8">
            <div className="flex h-12 w-12 items-center justify-center border border-slate-950 text-slate-950">
              <ShieldX className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
              Verifizierung fehlgeschlagen
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {error || 'Ungültiger Code.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-none">
                <Link href="/verify">
                  Neuen Zertifikatscode eingeben
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-8 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Zertifikatsprüfung
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {statusMeta.title}
                    </h1>
                    <p className="max-w-3xl text-base leading-8 text-slate-600">{statusMeta.body}</p>
                  </div>
                  <div className="flex h-12 items-center justify-center border border-slate-950 px-4 text-slate-950">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      KI-Register
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Zertifiziert für
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {certificate.holderName}
                    </h2>
                    {certificate.company ? (
                      <p className="text-base leading-7 text-slate-600">{certificate.company}</p>
                    ) : null}
                    <span
                      className={`inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusBadgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Zertifikatscode
                      </p>
                      <p className="mt-3 font-mono text-sm text-slate-950">
                        {certificate.certificateCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ausgestellt
                      </p>
                      <p className="mt-3 text-sm text-slate-950">{formatDate(certificate.issuedDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Gültig bis
                      </p>
                      <p className="mt-3 text-sm text-slate-950">{formatDate(certificate.validUntil)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Öffentliche URL
                      </p>
                      <a
                        href={certificate.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
                      >
                        Verifikation öffnen
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Zertifizierungsumfang
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {certificate.modules.map((module) => (
                        <span
                          key={module}
                          className="border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-3 border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dokument
                  </p>
                  <p className="text-sm leading-7 text-slate-600">
                    Dieses Zertifikat ist öffentlich über das KI-Register verifizierbar.
                  </p>
                  {certificate.latestDocumentUrl ? (
                    <Button asChild className="w-full rounded-none">
                      <a href={certificate.latestDocumentUrl} target="_blank" rel="noreferrer">
                        <FileDown className="mr-2 h-4 w-4" />
                        Zertifikats-PDF öffnen
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild className="w-full rounded-none">
                    <Link href="/verify">Anderen Code prüfen</Link>
                  </Button>
                </aside>
              </div>
            </section>
          </div>
        )}
      </main>
    </MarketingShell>
  );
}
