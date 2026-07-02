'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import type { Art4ModuleDefinition } from '@/lib/art4-training/definitions';
import { ART4_PASS_THRESHOLD } from '@/lib/art4-training/definitions';

interface Art4ModuleClientProps {
  locale: string;
  module: Art4ModuleDefinition;
}

interface SubmitResponse {
  passed?: boolean;
  score?: number;
  total?: number;
  results?: boolean[];
  error?: string;
  certificate?: {
    code: string;
    verifyUrl: string;
    documentUrl: string | null;
    validUntil: string | null;
    holderName: string;
  };
}

export function Art4BadgeRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="border border-slate-950 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
        Kostenlos
      </span>
      <span className="border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        KI-generierte Schulung
      </span>
      <span className="border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        Zertifikat mit Verify-Link
      </span>
    </div>
  );
}

export function Art4AiDisclosure() {
  return (
    <p className="border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
      Transparenzhinweis: Diese Schulung ist KI-generiert — das Skript wurde
      redaktionell kuratiert, Stimme und Folien wurden automatisiert erzeugt
      (synthetische Stimme). Sie dokumentiert Teilnahme und bestandene
      Lernkontrolle nach Art. 4 EU AI Act und ersetzt keine einzelfallbezogene
      Rechtsberatung.
    </p>
  );
}

export function Art4ModuleClient({ locale, module: mod }: Art4ModuleClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    mod.quiz.map(() => null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [company, setCompany] = useState('');

  const answeredCount = useMemo(
    () => answers.filter((value) => value !== null).length,
    [answers],
  );
  const allAnswered = answeredCount === mod.quiz.length;

  const loginHref = `/${locale}/login?mode=login&returnTo=${encodeURIComponent(
    `/${locale}/academy/ki-kompetenz/${mod.slug}`,
  )}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !allAnswered || submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/certification/art4/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleSlug: mod.slug,
          answers,
          company: company.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as SubmitResponse;
      if (!response.ok) {
        throw new Error(
          payload.error ?? 'Die Lernkontrolle konnte nicht ausgewertet werden.',
        );
      }
      setResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Die Lernkontrolle konnte nicht ausgewertet werden.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetQuiz() {
    setAnswers(mod.quiz.map(() => null));
    setResult(null);
    setErrorMessage(null);
  }

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Link
          href={`/${locale}/academy/ki-kompetenz`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Rollen
        </Link>

        <header className="mt-6 space-y-4 border-b border-slate-200 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            KI-Kompetenz nach Art. 4 · Verordnung (EU) 2024/1689
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {mod.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {mod.summary}
          </p>
          <Art4BadgeRow />
          <p className="text-sm text-slate-500">{mod.duration}</p>
        </header>

        <section className="mt-8 space-y-4" aria-label="Schulungsvideo">
          <div className="overflow-hidden border border-slate-200 bg-slate-950">
            <video
              controls
              preload="metadata"
              className="aspect-video h-auto w-full"
              src={mod.videoUrl}
            >
              Ihr Browser kann dieses Video nicht abspielen.
              <a href={mod.videoUrl}>Video herunterladen</a>
            </video>
          </div>
          <Art4AiDisclosure />
        </section>

        <section className="mt-12" aria-label="Lernkontrolle">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-semibold text-slate-950">
              Lernkontrolle
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {mod.quiz.length} Fragen · bestanden ab {ART4_PASS_THRESHOLD}{' '}
              richtigen Antworten. Nach Bestehen wird Ihr persönlicher
              Kompetenznachweis mit öffentlich prüfbarem Verify-Link
              ausgestellt.
            </p>
          </div>

          {result?.passed ? (
            <div className="mt-6 space-y-4 border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                <p className="text-lg font-semibold text-slate-950">
                  Bestanden — {result.score} von {result.total} Fragen richtig.
                </p>
              </div>
              {result.certificate ? (
                <div className="space-y-3 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700">
                  <p>
                    Ihr Nachweis wurde ausgestellt auf{' '}
                    <span className="font-medium text-slate-950">
                      {result.certificate.holderName}
                    </span>
                    .
                  </p>
                  <p className="font-mono text-xs tracking-wider text-slate-500">
                    Zertifikatscode: {result.certificate.code}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {result.certificate.documentUrl ? (
                      <Button asChild className="rounded-none">
                        <a
                          href={result.certificate.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Zertifikat (PDF) öffnen
                        </a>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" className="rounded-none">
                      <a
                        href={result.certificate.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Öffentlich verifizieren
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tipp: Hängen Sie das Zertifikat als Schulungsnachweis an die
                    betroffenen Einsatzfälle in Ihrem KI-Register.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-8">
              {result && !result.passed ? (
                <div className="flex items-start gap-3 border border-slate-300 bg-slate-50 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <div className="text-sm leading-6 text-slate-700">
                    <p className="font-medium text-slate-950">
                      Noch nicht bestanden — {result.score} von {result.total}{' '}
                      richtig (benötigt: {ART4_PASS_THRESHOLD}).
                    </p>
                    <p>
                      Falsch beantwortete Fragen sind markiert. Sehen Sie sich
                      die entsprechenden Abschnitte im Video erneut an und
                      versuchen Sie es noch einmal.
                    </p>
                  </div>
                </div>
              ) : null}

              {mod.quiz.map((question, questionIndex) => {
                const wasWrong =
                  result && !result.passed && result.results
                    ? result.results[questionIndex] === false
                    : false;
                return (
                  <fieldset
                    key={question.question}
                    className={`space-y-3 border p-5 ${
                      wasWrong
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <legend className="px-1 text-sm font-medium text-slate-950">
                      {questionIndex + 1}. {question.question}
                      {wasWrong ? (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Falsch beantwortet
                        </span>
                      ) : null}
                    </legend>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-start gap-3 border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 transition-colors hover:border-slate-400 has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50"
                        >
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={answers[questionIndex] === optionIndex}
                            onChange={() =>
                              setAnswers((current) => {
                                const next = [...current];
                                next[questionIndex] = optionIndex;
                                return next;
                              })
                            }
                            className="mt-1.5 accent-slate-950"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              <div className="space-y-4 border-t border-slate-200 pt-6">
                <div className="max-w-md space-y-2">
                  <label
                    htmlFor="art4-company"
                    className="text-sm font-medium text-slate-900"
                  >
                    Organisation für das Zertifikat{' '}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="art4-company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="z. B. Muster GmbH"
                    className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>

                {errorMessage ? (
                  <p className="text-sm text-slate-700">{errorMessage}</p>
                ) : null}

                {authLoading ? (
                  <Button disabled className="rounded-none">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bitte warten
                  </Button>
                ) : user ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      type="submit"
                      disabled={!allAnswered || submitting}
                      className="rounded-none"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird ausgewertet
                        </>
                      ) : (
                        'Lernkontrolle abgeben'
                      )}
                    </Button>
                    <span className="text-sm text-slate-500">
                      {answeredCount}/{mod.quiz.length} beantwortet
                    </span>
                    {result && !result.passed ? (
                      <button
                        type="button"
                        onClick={resetQuiz}
                        className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-950"
                      >
                        Antworten zurücksetzen
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-slate-600">
                      Für die Auswertung und das Zertifikat ist ein kostenloses
                      Konto nötig — so bleibt der Nachweis Ihrer Person
                      zuordenbar.
                    </p>
                    <Button asChild className="rounded-none">
                      <Link href={loginHref}>Anmelden und abgeben</Link>
                    </Button>
                  </div>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </MarketingShell>
  );
}
