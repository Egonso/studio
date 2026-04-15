'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Shield, XCircle } from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { localizeHref } from '@/lib/i18n/localize-href';
import type { PublicUseCaseIndexEntry } from '@/lib/register-first';
import { lookupPublicUseCase } from '@/lib/register-first/register-repository';

type LoadingState = 'loading' | 'found' | 'not_found' | 'error';

function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB');
}

function getVerifyPassCopy(locale: string) {
  if (locale === 'de') {
    return {
      appName: 'KI Register',
      publicVerification: 'Öffentliche Verifikation',
      loading: 'Use-Case-Pass wird verifiziert…',
      notFoundTitle: 'Nicht gefunden',
      errorTitle: 'Fehler',
      notFoundDescription:
        'Kein öffentlicher Use-Case-Pass mit diesem Hash wurde gefunden.',
      unknownError: 'Unbekannter Fehler.',
      retryError:
        'Fehler bei der Überprüfung. Bitte versuche es später erneut.',
      home: 'Zur Startseite',
      title: 'Verifizierter Use-Case-Pass',
      description:
        'Diese Seite zeigt den öffentlichen Nachweisstatus eines einzelnen KI-Einsatzfalls im KI Register.',
      useCase: 'Einsatzfall',
      organisation: 'Organisation',
      tool: 'Tool',
      publicHash: 'Öffentlicher Hash',
      dataCategory: 'Datenkategorie',
      created: 'Erstellt',
      verification: 'Verifikation',
      governanceEvidence: 'Governance-Nachweis',
      governanceDescription:
        'Der öffentliche Pass zeigt die einsatzfallbezogene Evidenz im Register. Er ersetzt keine individuelle Rechtsberatung, macht aber Status, Zweck, Verantwortungs- und Verifikationslogik überprüfbar.',
      notPublished: 'Nicht veröffentlicht',
      verificationReal: 'Realer Einsatz',
      verificationTest: 'Test oder Demo',
      verificationCurrent: 'aktuell',
      dataCategoryLabels: {
        NONE: 'Keine besonderen Daten',
        INTERNAL: 'Interne Daten',
        PERSONAL: 'Personenbezogene Daten',
        SENSITIVE: 'Sensible Daten',
        fallback: 'Standard',
      },
      statuses: {
        PROOF_READY: 'Nachweisfähig',
        REVIEWED: 'Geprüft',
        REVIEW_RECOMMENDED: 'Prüfung empfohlen',
        fallback: 'Offen',
      },
    } as const;
  }

  return {
    appName: 'AI Registry',
    publicVerification: 'Public verification',
    loading: 'Verifying use case pass…',
    notFoundTitle: 'Not found',
    errorTitle: 'Error',
    notFoundDescription:
      'No public use case pass could be found for this hash.',
    unknownError: 'Unknown error.',
    retryError:
      'Verification failed. Please try again later.',
    home: 'Back to home',
    title: 'Verified use case pass',
    description:
      'This page shows the public evidence status of a single AI use case in AI Registry.',
    useCase: 'Use case',
    organisation: 'Organisation',
    tool: 'Tool',
    publicHash: 'Public hash',
    dataCategory: 'Data category',
    created: 'Created',
    verification: 'Verification',
    governanceEvidence: 'Governance evidence',
    governanceDescription:
      'The public pass shows use-case-specific evidence from the register. It does not replace individual legal advice, but it makes status, purpose, responsibility and verification logic reviewable.',
    notPublished: 'Not published',
    verificationReal: 'Real deployment',
    verificationTest: 'Test or demo',
    verificationCurrent: 'current',
    dataCategoryLabels: {
      NONE: 'No special data',
      INTERNAL: 'Internal data',
      PERSONAL: 'Personal data',
      SENSITIVE: 'Sensitive data',
      fallback: 'Standard',
    },
    statuses: {
      PROOF_READY: 'Evidence-ready',
      REVIEWED: 'Reviewed',
      REVIEW_RECOMMENDED: 'Review recommended',
      fallback: 'Open',
    },
  } as const;
}

function getStatusMeta(
  status: PublicUseCaseIndexEntry['status'],
  copy: ReturnType<typeof getVerifyPassCopy>,
) {
  if (status === 'PROOF_READY') {
    return {
      label: copy.statuses.PROOF_READY,
      dotClass: 'bg-slate-950',
    };
  }

  if (status === 'REVIEWED') {
    return {
      label: copy.statuses.REVIEWED,
      dotClass: 'bg-slate-700',
    };
  }

  return {
    label:
      status === 'REVIEW_RECOMMENDED'
        ? copy.statuses.REVIEW_RECOMMENDED
        : copy.statuses.fallback,
    dotClass: 'bg-slate-400',
  };
}

export default function VerifyPassPage() {
  const params = useParams() ?? {};
  const locale = (params.locale as string) || 'de';
  const hashId = params.hashId as string;
  const copy = useMemo(() => getVerifyPassCopy(locale), [locale]);

  const [state, setState] = useState<LoadingState>('loading');
  const [entry, setEntry] = useState<PublicUseCaseIndexEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hashId || hashId.length < 8) {
      setState('not_found');
      return;
    }

    const fetchEntry = async () => {
      try {
        const result = await lookupPublicUseCase(hashId);

        if (!result) {
          setState('not_found');
          return;
        }

        setEntry(result);
        setState('found');
      } catch (err) {
        console.error('Verify pass error:', err);
        setErrorMessage(copy.retryError);
        setState('error');
      }
    };

    void fetchEntry();
  }, [copy.retryError, hashId]);

  const homeHref = localizeHref(locale, '/');

  if (state === 'loading') {
    return (
      <MarketingShell>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-slate-700" />
          <p className="text-sm text-slate-600">{copy.loading}</p>
        </div>
      </MarketingShell>
    );
  }

  if (state === 'not_found' || state === 'error' || !entry) {
    return (
      <MarketingShell>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
          <div className="w-full max-w-md border border-slate-200 bg-white p-8">
            <div className="flex h-12 w-12 items-center justify-center border border-slate-950 text-slate-950">
              <XCircle className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
              {state === 'not_found' ? copy.notFoundTitle : copy.errorTitle}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {state === 'not_found'
                ? copy.notFoundDescription
                : errorMessage ?? copy.unknownError}
            </p>
            <div className="mt-6">
              <Link
                href={homeHref}
                className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
              >
                {copy.home}
              </Link>
            </div>
          </div>
        </div>
      </MarketingShell>
    );
  }

  const statusMeta = getStatusMeta(entry.status, copy);
  const dataCategoryLabel =
    copy.dataCategoryLabels[
      (entry.dataCategory ?? '') as keyof typeof copy.dataCategoryLabels
    ] ?? copy.dataCategoryLabels.fallback;

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

        <div className="mx-auto max-w-3xl">
          <header className="border-b border-slate-200 pb-5">
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              {copy.description}
            </p>
          </header>

          <section className="mt-8 border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {copy.useCase}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {entry.purpose}
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    {entry.globalUseCaseId}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-950">
                  <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                  <span className="font-medium">{statusMeta.label}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.organisation}
                </p>
                <p className="mt-2 text-sm text-slate-950">
                  {entry.organisationName ?? copy.notPublished}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.tool}
                </p>
                <p className="mt-2 text-sm text-slate-950">{entry.toolName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.publicHash}
                </p>
                <p className="mt-2 font-mono text-sm text-slate-950">
                  {entry.publicHashId}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.dataCategory}
                </p>
                <p className="mt-2 text-sm text-slate-950">{dataCategoryLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.created}
                </p>
                <p className="mt-2 text-sm text-slate-950">
                  {formatDate(entry.createdAt, locale)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.verification}
                </p>
                <p className="mt-2 text-sm text-slate-950">
                  {entry.verification?.isReal
                    ? copy.verificationReal
                    : copy.verificationTest}
                  {entry.verification?.isCurrent
                    ? ` (${copy.verificationCurrent})`
                    : ''}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 border border-slate-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700" />
              <p className="text-sm font-medium text-slate-950">
                {copy.governanceEvidence}
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {copy.governanceDescription}
            </p>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}
