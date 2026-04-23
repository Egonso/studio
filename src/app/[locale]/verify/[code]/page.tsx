'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ExternalLink,
  FileDown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { CertificateBadgeCard } from '@/components/certification/certificate-badge-card';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { localizeHref } from '@/lib/i18n/localize-href';

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

function formatDate(value: string | null, locale: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusDotClass(status: PublicCertificate['status']) {
  return status === 'active' ? 'bg-slate-950' : 'bg-slate-400';
}

function getVerificationCopy(locale: string) {
  if (locale === 'de') {
    return {
      appName: 'KI Register',
      publicVerification: 'Öffentliche Verifikation',
      certificationReview: 'Zertifizierungsprüfung',
      loading: 'Zertifikat wird geprüft…',
      failedTitle: 'Verifizierung fehlgeschlagen',
      invalidCode: 'Ungültiger Code.',
      enterNewCode: 'Neuen Zertifikatscode eingeben',
      certifiedFor: 'Zertifiziert für',
      certificateCode: 'Zertifikatscode',
      issuedOn: 'Ausgestellt',
      validUntil: 'Gültig bis',
      publicUrl: 'Öffentliche URL',
      openVerification: 'Verifikation öffnen',
      scope: 'Zertifizierungsumfang',
      document: 'Dokument',
      documentDescription:
        'Dieses Zertifikat ist öffentlich über das KI Register verifizierbar.',
      openPdf: 'Zertifikats-PDF öffnen',
      regeneratePdf: 'Zertifikat neu generieren',
      regeneratingPdf: 'PDF wird neu generiert…',
      regenerateDescription:
        'Falls der gespeicherte Link leer oder abgelaufen ist, können Sie hier jederzeit eine neue PDF-Version erzeugen.',
      regenerateSuccess:
        'Das Zertifikat wurde neu generiert. Der aktuelle PDF-Link ist jetzt wieder verfügbar.',
      regenerateFailed:
        'Das Zertifikat konnte gerade nicht neu generiert werden. Bitte versuchen Sie es erneut.',
      badge: {
        title: 'HTML/CSS-Badge',
        copy: 'Embed-Code kopieren',
        copied: 'Badge kopiert',
        openVerification: 'Verifikation öffnen',
        showQr: 'QR anzeigen',
        left: 'Links',
        center: 'Mitte',
        right: 'Rechts',
      },
      verifyAnother: 'Anderen Code prüfen',
      notSet: 'Nicht gesetzt',
      errors: {
        notFound: 'Zertifikat nicht gefunden oder ungültig.',
        failed: 'Fehler bei der Überprüfung.',
        retry: 'Fehler bei der Überprüfung. Bitte versuchen Sie es später erneut.',
      },
      statuses: {
        active: {
          title: 'Gültiges Zertifikat',
          label: 'Aktiv',
          body:
            'Dieses Zertifikat bestätigt die erfolgreiche Kompetenzprüfung im KI Register.',
        },
        expired: {
          title: 'Abgelaufenes Zertifikat',
          label: 'Abgelaufen',
          body:
            'Dieses Zertifikat ist historisch nachvollziehbar, aber nicht mehr aktuell gültig.',
        },
        revoked: {
          title: 'Widerrufenes Zertifikat',
          label: 'Widerrufen',
          body:
            'Dieses Zertifikat wurde widerrufen und darf nicht mehr als aktueller Nachweis verwendet werden.',
        },
      },
    } as const;
  }

  return {
    appName: 'AI Registry',
    publicVerification: 'Public verification',
    certificationReview: 'Certification review',
    loading: 'Verifying certificate…',
    failedTitle: 'Verification failed',
    invalidCode: 'Invalid code.',
    enterNewCode: 'Enter a new certificate code',
    certifiedFor: 'Certified for',
    certificateCode: 'Certificate code',
    issuedOn: 'Issued on',
    validUntil: 'Valid until',
    publicUrl: 'Public URL',
    openVerification: 'Open verification',
    scope: 'Certification scope',
    document: 'Document',
    documentDescription:
      'This certificate can be verified publicly through AI Registry.',
    openPdf: 'Open certificate PDF',
    regeneratePdf: 'Regenerate certificate',
    regeneratingPdf: 'Regenerating PDF…',
    regenerateDescription:
      'If the stored link has expired or gone blank, you can create a fresh PDF here at any time.',
    regenerateSuccess:
      'The certificate was regenerated. The current PDF link is available again.',
    regenerateFailed:
      'The certificate could not be regenerated right now. Please try again.',
    badge: {
      title: 'HTML/CSS badge',
      copy: 'Copy embed code',
      copied: 'Badge copied',
      openVerification: 'Open verification',
      showQr: 'Show QR',
      left: 'Left',
      center: 'Center',
      right: 'Right',
    },
    verifyAnother: 'Verify another code',
    notSet: 'Not set',
    errors: {
      notFound: 'Certificate not found or invalid.',
      failed: 'Verification failed.',
      retry: 'Verification failed. Please try again later.',
    },
    statuses: {
      active: {
        title: 'Valid certificate',
        label: 'Active',
        body:
          'This certificate confirms successful completion of the competency review in AI Registry.',
      },
      expired: {
        title: 'Expired certificate',
        label: 'Expired',
        body:
          'This certificate remains historically traceable, but it is no longer currently valid.',
      },
      revoked: {
        title: 'Revoked certificate',
        label: 'Revoked',
        body:
          'This certificate has been revoked and must no longer be used as current evidence.',
      },
    },
  } as const;
}

export default function VerificationPage() {
  const params = useParams() ?? {};
  const locale = (params.locale as string) || 'de';
  const code = params.code as string;
  const copy = useMemo(() => getVerificationCopy(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<PublicCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      return;
    }

    const fetchCertificate = async () => {
      try {
        const response = await fetch(
          `/api/certification/public/${encodeURIComponent(code)}`,
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404 ? copy.errors.notFound : copy.errors.failed,
          );
        }

        const payload = await response.json();
        setCertificate(payload as PublicCertificate);
      } catch (fetchError) {
        console.error('Verification error:', fetchError);
        setError(
          fetchError instanceof Error ? fetchError.message : copy.errors.retry,
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchCertificate();
  }, [code, copy.errors.failed, copy.errors.notFound, copy.errors.retry]);

  const statusMeta = useMemo(() => {
    switch (certificate?.status) {
      case 'expired':
        return copy.statuses.expired;
      case 'revoked':
        return copy.statuses.revoked;
      default:
        return copy.statuses.active;
    }
  }, [certificate?.status, copy.statuses.active, copy.statuses.expired, copy.statuses.revoked]);

  const homeHref = localizeHref(locale, '/');
  const verifyHref = localizeHref(locale, '/verify');

  const handleRegenerate = async () => {
    if (!code || isRegenerating) {
      return;
    }

    setIsRegenerating(true);
    setDocumentNotice(null);
    setDocumentError(null);

    try {
      const response = await fetch(
        `/api/certification/public/${encodeURIComponent(code)}`,
        {
          method: 'POST',
        },
      );
      const payload = (await response.json()) as PublicCertificate & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || copy.regenerateFailed);
      }

      setCertificate(payload);
      setDocumentNotice(copy.regenerateSuccess);
    } catch (regenerateError) {
      console.error('Certificate regeneration error:', regenerateError);
      setDocumentError(
        regenerateError instanceof Error
          ? regenerateError.message
          : copy.regenerateFailed,
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-12 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link
            href={homeHref}
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt={copy.appName}
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>{copy.appName}</span>
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {copy.publicVerification}
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center border border-slate-200 bg-white px-6 py-12">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.loading}
            </div>
          </div>
        ) : error || !certificate ? (
          <div className="border border-slate-200 bg-white p-8">
            <div className="flex h-12 w-12 items-center justify-center border border-slate-950 text-slate-950">
              <ShieldX className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
              {copy.failedTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {error || copy.invalidCode}
            </p>
            <div className="mt-8">
              <Link
                href={verifyHref}
                className="inline-flex text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
              >
                {copy.enterNewCode}
              </Link>
            </div>
          </div>
        ) : (
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-8 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {copy.certificationReview}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {statusMeta.title}
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-slate-600">
                    {statusMeta.body}
                  </p>
                </div>
                <div className="flex h-12 items-center justify-center border border-slate-950 px-4 text-slate-950">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {copy.appName}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-6 py-8 sm:px-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {copy.certifiedFor}
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {certificate.holderName}
                  </h2>
                  {certificate.company ? (
                    <p className="text-base leading-7 text-slate-600">
                      {certificate.company}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2 text-sm text-slate-950">
                    <span
                      className={`h-2 w-2 rounded-full ${getStatusDotClass(certificate.status)}`}
                    />
                    <span className="font-medium">{statusMeta.label}</span>
                  </div>
                </div>

                <div className="grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.certificateCode}
                    </p>
                    <p className="mt-3 font-mono text-sm text-slate-950">
                      {certificate.certificateCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.issuedOn}
                    </p>
                    <p className="mt-3 text-sm text-slate-950">
                      {formatDate(certificate.issuedDate, locale, copy.notSet)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.validUntil}
                    </p>
                    <p className="mt-3 text-sm text-slate-950">
                      {formatDate(certificate.validUntil, locale, copy.notSet)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.publicUrl}
                    </p>
                    <a
                      href={certificate.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                    >
                      {copy.openVerification}
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {copy.scope}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {certificate.modules.map((module) => (
                      <li
                        key={module}
                        className="flex items-start gap-3 text-[14px] leading-7 text-slate-700"
                      >
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                        <span>{module}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                </div>

                <aside className="space-y-4 border border-slate-200 px-5 py-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.document}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {copy.documentDescription}
                    </p>
                  </div>
                  {certificate.latestDocumentUrl ? (
                    <a
                      href={certificate.latestDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      {copy.openPdf}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void handleRegenerate();
                    }}
                    disabled={isRegenerating}
                    className="inline-flex items-center justify-center border border-slate-950 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    {isRegenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isRegenerating ? copy.regeneratingPdf : copy.regeneratePdf}
                  </button>
                  <p className="text-sm leading-7 text-slate-600">
                    {copy.regenerateDescription}
                  </p>
                  {documentNotice ? (
                    <p className="text-sm leading-7 text-emerald-700">{documentNotice}</p>
                  ) : null}
                  {documentError ? (
                    <p className="text-sm leading-7 text-rose-700">{documentError}</p>
                  ) : null}
                  <Link
                    href={verifyHref}
                    className="block text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                  >
                    {copy.verifyAnother}
                  </Link>
                </aside>
              </div>

              {certificate.status === 'active' ? (
                <CertificateBadgeCard
                  certificateCode={certificate.certificateCode}
                  holderName={certificate.holderName}
                  labels={copy.badge}
                />
              ) : null}
            </div>
          </section>
        )}
      </main>
    </MarketingShell>
  );
}
