'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  ScrollText,
  Sheet as SheetIcon,
} from 'lucide-react';

import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { buildAuthPath } from '@/lib/auth/login-routing';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import {
  type AcademyProgramDefinition,
  type AcademyProgramResource,
} from '@/lib/academy-programs';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';

function resolveProgramHref(locale: string, href: string): string {
  if (/^https?:\/\//.test(href)) {
    return href;
  }

  if (
    href.startsWith('/resources/') ||
    href.startsWith('/downloads/') ||
    href.startsWith(`/${locale}/`)
  ) {
    return href;
  }

  return `/${locale}${href}`;
}

function ResourceIcon({ format }: { format: AcademyProgramResource['format'] }) {
  if (format === 'PDF') {
    return <FileText className="h-4 w-4" />;
  }

  if (format === 'XLSX') {
    return <SheetIcon className="h-4 w-4" />;
  }

  return <ExternalLink className="h-4 w-4" />;
}

interface AcademyProgramPageProps {
  locale: string;
  program: AcademyProgramDefinition;
  selectedLessonSlug?: string;
}

type SearchParamsLike = {
  toString(): string;
} | null;

function buildLocalizedLoginHref(
  locale: string,
  returnTo: string,
): string {
  const authPath = buildAuthPath({
    intent: 'create_register',
    mode: 'login',
    returnTo,
  });

  return `/${locale}/login${authPath === '/' ? '' : authPath.slice(1)}`;
}

function buildAcademyProgramHref(
  locale: string,
  programSlug: string,
  lessonSlug?: string,
  academyGrant?: string | null,
): string {
  const basePath = lessonSlug
    ? `/${locale}/academy/${programSlug}/${lessonSlug}`
    : `/${locale}/academy/${programSlug}`;

  if (!academyGrant) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set('academy_grant', academyGrant);
  return `${basePath}?${params.toString()}`;
}

function buildPathWithSearch(
  pathname: string,
  searchParams: SearchParamsLike,
): string {
  const query = searchParams?.toString() ?? '';
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function buildCheckoutReturnTo(
  pathname: string,
  searchParams: SearchParamsLike,
): string {
  const params = new URLSearchParams(searchParams?.toString() ?? '');
  params.delete('academy_grant');
  const query = params.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

export function AcademyProgramPage({
  locale,
  program,
  selectedLessonSlug,
}: AcademyProgramPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    allowed,
    loading: capabilityLoading,
    requiredPlanLabel,
  } = useCapability('competencyMatrix');
  const fallbackPathname = selectedLessonSlug
    ? `/${locale}/academy/${program.slug}/${selectedLessonSlug}`
    : `/${locale}/academy/${program.slug}`;
  const resolvedPathname = pathname ?? fallbackPathname;
  const [grantActivationState, setGrantActivationState] = useState<
    'idle' | 'starting' | 'error'
  >('idle');
  const [grantError, setGrantError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        buildLocalizedLoginHref(
          locale,
          buildPathWithSearch(resolvedPathname, searchParams),
        ),
      );
    }
  }, [authLoading, locale, resolvedPathname, router, searchParams, user]);

  const academyGrant = useMemo(() => {
    const rawValue = searchParams?.get('academy_grant')?.trim();
    return rawValue && rawValue.length > 0 ? rawValue : null;
  }, [searchParams]);

  const checkoutReturnTo = useMemo(
    () => buildCheckoutReturnTo(resolvedPathname, searchParams),
    [resolvedPathname, searchParams],
  );

  const selectedLesson = useMemo(
    () =>
      program.lessons.find((lesson) => lesson.slug === selectedLessonSlug) ??
      program.lessons[0],
    [program.lessons, selectedLessonSlug],
  );

  const startGrantCheckout = useCallback(async () => {
    if (!user || !academyGrant) {
      return;
    }

    setGrantActivationState('starting');
    setGrantError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingInterval: 'month',
          promotionCode: academyGrant,
          returnTo: checkoutReturnTo,
          targetPlan: 'pro',
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || typeof payload.url !== 'string') {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Die Freischaltung konnte gerade nicht gestartet werden.',
        );
      }

      window.location.assign(payload.url);
    } catch (error) {
      setGrantActivationState('error');
      setGrantError(
        error instanceof Error
          ? error.message
          : 'Die Freischaltung konnte gerade nicht gestartet werden.',
      );
    }
  }, [academyGrant, checkoutReturnTo, user]);

  useEffect(() => {
    if (
      authLoading ||
      capabilityLoading ||
      !user ||
      allowed ||
      !academyGrant ||
      grantActivationState !== 'idle'
    ) {
      return;
    }

    void startGrantCheckout();
  }, [
    academyGrant,
    allowed,
    authLoading,
    capabilityLoading,
    grantActivationState,
    startGrantCheckout,
    user,
  ]);

  if (authLoading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={program.title}
        description={program.summary}
        nextStep="Kursmodule und Materialien werden vorbereitet."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Academy wird geladen"
          description="Zugriff, Kursstruktur und Materialien werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  if (!allowed) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={program.title}
        description={program.summary}
        nextStep="Die Zusatzprogramme liegen in der bezahlten Academy."
      >
        <PageStatePanel
          area="paid_governance_control"
          title={`${program.title} ist Teil der Academy`}
          description={
            grantError ??
            (academyGrant
              ? 'Dieser Link enthält bereits eine Freischaltung für genau diesen Kurskontext. Die Aktivierung wird vorbereitet oder kann unten erneut ausgelöst werden.'
              : `${requiredPlanLabel} schaltet diesen Kurs in der Governance Academy frei. Promotion-Codes werden im bestehenden Stripe-Checkout bereits unterstützt und können auch für vollständige Einzel-Freischaltungen genutzt werden.`)
          }
          actions={
            <>
              {academyGrant ? (
                <Button
                  onClick={() => void startGrantCheckout()}
                  disabled={grantActivationState === 'starting'}
                >
                  {grantActivationState === 'starting' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Gratis freischalten
                </Button>
              ) : (
                <Button asChild>
                  <Link href={ROUTE_HREFS.governanceUpgrade}>Checkout öffnen</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.academy}>Zur Academy</Link>
              </Button>
            </>
          }
        />
      </SignedInAreaFrame>
    );
  }

  if (!selectedLesson) {
    return null;
  }

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title={program.title}
      description={program.summary}
      nextStep="Wählen Sie links ein Modul und öffnen Sie die Materialien direkt im Kurskontext."
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {program.strapline}
                </p>
                <CardTitle className="text-xl">{program.title}</CardTitle>
              </div>
              <p className="text-sm leading-7 text-slate-600">{program.summary}</p>
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/${locale}/academy`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Academy-Übersicht
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Geeignet für
                </p>
                <ul className="space-y-2 text-sm leading-7 text-slate-700">
                  {program.targetAudience.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Dieser Track liefert
                </p>
                <ul className="space-y-2 text-sm leading-7 text-slate-700">
                  {program.delivers.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Module
                </p>
                <div className="space-y-2">
                  {program.lessons.map((lesson, index) => {
                    const isActive = lesson.id === selectedLesson.id;
                    return (
                      <Link
                        key={lesson.id}
                        href={buildAcademyProgramHref(
                          locale,
                          program.slug,
                          lesson.slug,
                          academyGrant,
                        )}
                        className={`block w-full border px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-950 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <PlayCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                              Modul {index + 1}
                            </p>
                            <p className="text-sm font-medium leading-6">
                              {lesson.title}
                            </p>
                            <p className="text-xs leading-5 opacity-80">
                              {lesson.presenter} · {lesson.duration}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {selectedLesson.presenter} · {selectedLesson.duration}
              </p>
              <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
              <p className="text-sm leading-7 text-slate-600">
                {selectedLesson.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={buildAcademyProgramHref(locale, program.slug)}>
                    Kurs-Unterseite
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={buildAcademyProgramHref(
                      locale,
                      program.slug,
                      selectedLesson.slug,
                      academyGrant,
                    )}
                  >
                    Modul-Unterseite
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-hidden border border-slate-200 bg-slate-950">
                <div className="aspect-[16/9] w-full">
                  <iframe
                    src={selectedLesson.embedUrl}
                    title={selectedLesson.title}
                    className="h-full w-full"
                    allow="autoplay; gyroscope; picture-in-picture;"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Begleittext
                    </p>
                    {selectedLesson.transcriptHighlights.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-7 text-slate-700"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Zugangslogik
                    </p>
                    <p className="text-sm leading-7 text-slate-700">
                      {program.accessNote}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border border-slate-200 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Materialien im Kontext
                  </p>
                  <div className="space-y-3">
                    {selectedLesson.resources.map((resource) => {
                      const href = resolveProgramHref(locale, resource.href);
                      const isPage = resource.format === 'Seite';
                      return (
                        <div
                          key={`${resource.label}-${resource.href}`}
                          className="border border-slate-200 px-4 py-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-slate-700">
                              <ResourceIcon format={resource.format} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="text-sm font-medium text-slate-950">
                                {resource.label}
                              </p>
                              <p className="text-sm leading-6 text-slate-600">
                                {resource.description}
                              </p>
                              {isPage ? (
                                <Link
                                  href={href}
                                  className="inline-flex text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                                >
                                  Seite öffnen
                                </Link>
                              ) : (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-700"
                                >
                                  Datei öffnen
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Nächster Schritt
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  Wechseln Sie danach direkt in Register, Standards oder Artefakte,
                  damit der Kurs nicht abstrakt bleibt, sondern in reale
                  Nachweisarbeit übergeht.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${locale}/standards/use-case-pass`}>
                    <ScrollText className="mr-2 h-4 w-4" />
                    Pass-Standard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SignedInAreaFrame>
  );
}
