'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Trophy,
  XCircle,
} from 'lucide-react';

import { CertificateBadgeCard } from '@/components/certification/certificate-badge-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { LEGACY_EXAM_DEFINITION } from '@/lib/certification/legacy-question-bank';
import type { ExamSectionResult, PersonCertificateRecord } from '@/lib/certification/types';
import { getCourseProgress } from '@/lib/data-service';

type ExamApiResult = {
  attempt: {
    attemptId: string;
    attemptNumber: number;
    status: string;
    sectionResults: ExamSectionResult[];
    totalScore: number;
  };
  certificate: PersonCertificateRecord | null;
  document: {
    url: string;
  } | null;
  badgeHtml: string | null;
};

type LocalIdentity = {
  uid: string;
  email: string;
  displayName?: string | null;
  devMode: boolean;
};

const TOTAL_QUESTIONS = LEGACY_EXAM_DEFINITION.sections.reduce(
  (sum, section) => sum + section.questions.length,
  0,
);

function computeLocalSectionScore(sectionIndex: number, answers: number[]): ExamSectionResult {
  const section = LEGACY_EXAM_DEFINITION.sections[sectionIndex];
  let correctAnswers = 0;

  section.questions.forEach((question, questionIndex) => {
    if (answers[questionIndex] === question.correctAnswer) {
      correctAnswers += 1;
    }
  });

  const score = Math.round((correctAnswers / section.questions.length) * 10000) / 100;

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    score,
    passed: score >= LEGACY_EXAM_DEFINITION.passThreshold,
    correctAnswers,
    totalQuestions: section.questions.length,
  };
}

export function CertificationExamClient() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const [courseUnlocked, setCourseUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sectionAnswers, setSectionAnswers] = useState<number[][]>(
    LEGACY_EXAM_DEFINITION.sections.map(() => []),
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    LEGACY_EXAM_DEFINITION.questionTimeLimitSeconds,
  );
  const [sectionReview, setSectionReview] = useState<ExamSectionResult | null>(null);
  const [result, setResult] = useState<ExamApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sectionAnswersRef = useRef(sectionAnswers);

  const devEmail =
    process.env.NODE_ENV !== 'production' && searchParams.get('dev-auth') === '1'
      ? searchParams.get('email')?.trim().toLowerCase() || 'test@kiregister.dev'
      : null;

  const identity: LocalIdentity | null = useMemo(() => {
    if (user?.email) {
      return {
        uid: user.uid,
        email: user.email.toLowerCase(),
        displayName: user.displayName,
        devMode: false,
      };
    }

    if (devEmail) {
      return {
        uid: `dev:${devEmail}`,
        email: devEmail,
        displayName: devEmail,
        devMode: true,
      };
    }

    return null;
  }, [devEmail, user]);

  useEffect(() => {
    sectionAnswersRef.current = sectionAnswers;
  }, [sectionAnswers]);

  useEffect(() => {
    if (!identity) {
      setUnlockLoading(false);
      return;
    }

    const currentIdentity = identity;

    let cancelled = false;

    async function loadProgress() {
      try {
        const progress = await getCourseProgress();
        if (cancelled) {
          return;
        }
        setCourseUnlocked(progress.length > 0 || currentIdentity.devMode);
      } catch {
        if (!cancelled) {
          setCourseUnlocked(currentIdentity.devMode);
        }
      } finally {
        if (!cancelled) {
          setUnlockLoading(false);
        }
      }
    }

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [identity]);

  const currentSection = LEGACY_EXAM_DEFINITION.sections[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];

  const answeredQuestions = useMemo(
    () =>
      sectionAnswers.reduce(
        (sum, answers) => sum + answers.filter((answer) => typeof answer === 'number').length,
        0,
      ),
    [sectionAnswers],
  );

  const examProgressPercent = Math.round((answeredQuestions / TOTAL_QUESTIONS) * 100);

  async function buildAuthHeaders(): Promise<Record<string, string>> {
    if (!identity) {
      throw new Error('Authentication required.');
    }

    if (identity.devMode) {
      return {
        'Content-Type': 'application/json',
        'X-Dev-Auth-Email': identity.email,
        'X-Dev-Auth-Name': identity.displayName || identity.email,
      };
    }

    const token = await user?.getIdToken();
    if (!token) {
      throw new Error('Authentication token missing.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async function handleStartExam() {
    try {
      setError(null);
      setIsStarting(true);
      const headers = await buildAuthHeaders();
      const response = await fetch('/api/certification/exam/start', {
        method: 'POST',
        headers,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Exam could not be started.');
      }
      setAttemptId(payload.attempt.attemptId);
      setTimeLeft(LEGACY_EXAM_DEFINITION.questionTimeLimitSeconds);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Exam start failed.');
    } finally {
      setIsStarting(false);
    }
  }

  function handleAnswerChange(answerIndex: number) {
    const nextAnswers = [...sectionAnswers];
    const sectionClone = [...nextAnswers[currentSectionIndex]];
    sectionClone[currentQuestionIndex] = answerIndex;
    nextAnswers[currentSectionIndex] = sectionClone;
    setSectionAnswers(nextAnswers);
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
  }

  const resetQuestionTimer = useCallback(() => {
    setTimeLeft(LEGACY_EXAM_DEFINITION.questionTimeLimitSeconds);
  }, []);

  const handleAdvanceQuestion = useCallback((fromTimeout = false, answerState = sectionAnswers) => {
    const nextAnswers = [...answerState];
    const sectionClone = [...nextAnswers[currentSectionIndex]];

    if (fromTimeout && typeof sectionClone[currentQuestionIndex] !== 'number') {
      sectionClone[currentQuestionIndex] = -1;
      nextAnswers[currentSectionIndex] = sectionClone;
      setSectionAnswers(nextAnswers);
    }

    const isLastQuestionInSection =
      currentQuestionIndex === currentSection.questions.length - 1;

    if (isLastQuestionInSection) {
      setSectionReview(
        computeLocalSectionScore(currentSectionIndex, nextAnswers[currentSectionIndex] ?? []),
      );
      setSelectedAnswer(null);
      setShowExplanation(false);
      resetQuestionTimer();
      return;
    }

    setCurrentQuestionIndex((previous) => previous + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    resetQuestionTimer();
  }, [
    currentQuestionIndex,
    currentSection.questions.length,
    currentSectionIndex,
    resetQuestionTimer,
    sectionAnswers,
  ]);

  useEffect(() => {
    if (!attemptId || sectionReview || result) {
      return;
    }

    if (showExplanation) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          handleAdvanceQuestion(true, sectionAnswersRef.current);
          return LEGACY_EXAM_DEFINITION.questionTimeLimitSeconds;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    attemptId,
    currentQuestionIndex,
    currentSectionIndex,
    handleAdvanceQuestion,
    result,
    sectionReview,
    showExplanation,
  ]);

  function handleRepeatSection() {
    const nextAnswers = [...sectionAnswers];
    nextAnswers[currentSectionIndex] = [];
    setSectionAnswers(nextAnswers);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setSectionReview(null);
    resetQuestionTimer();
  }

  async function handleContinueAfterSection() {
    if (!sectionReview) {
      return;
    }

    const isLastSection =
      currentSectionIndex === LEGACY_EXAM_DEFINITION.sections.length - 1;

    if (!isLastSection) {
      setCurrentSectionIndex((previous) => previous + 1);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setSectionReview(null);
      resetQuestionTimer();
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const headers = await buildAuthHeaders();
      const response = await fetch('/api/certification/exam/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          attemptId,
          sectionAnswers,
          company: company.trim() || null,
        }),
      });
      const payload = (await response.json()) as ExamApiResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Exam submission failed.');
      }
      setResult(payload);
      setSectionReview(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Exam submission failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || unlockLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Prüfung nur für angemeldete Nutzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Melden Sie sich zuerst an, damit Prüfungsversuche, Zertifikate und
            Verifikation Ihrem Konto zugeordnet werden können.
          </p>
          <Button asChild>
            <Link href="/login">Jetzt anmelden</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!courseUnlocked) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Prüfung noch gesperrt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Starten Sie zuerst mindestens ein Academy-Modul. Danach bleibt die
            Prüfung für Sie freigeschaltet.
          </p>
          <Button asChild>
            <Link href="/academy">Academy öffnen</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    const passed = result.attempt.status === 'passed';
    const certificate = result.certificate;

    return (
      <div className="space-y-6">
        <Card className={passed ? 'border-gray-200' : 'border-red-200'}>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-3 ${
                    passed ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {passed ? (
                    <Trophy className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {passed ? 'Prüfung bestanden' : 'Prüfung nicht bestanden'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Gesamtergebnis {result.attempt.totalScore.toFixed(2)}%
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Neuer Prüfungsversuch
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {result.attempt.sectionResults.map((section) => (
                <div
                  key={section.sectionId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        {section.sectionTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {section.correctAnswers}/{section.totalQuestions} korrekt
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        section.passed ? 'text-gray-700' : 'text-red-700'
                      }`}
                    >
                      {section.score.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {certificate ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Personenzertifikat
                    </p>
                    <h3 className="text-xl font-semibold text-slate-950">
                      {certificate.holderName}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Code {certificate.certificateCode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                      <a href={certificate.publicUrl} target="_blank" rel="noreferrer">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verifikation öffnen
                      </a>
                    </Button>
                    {certificate.latestDocumentUrl ? (
                      <Button asChild>
                        <a
                          href={certificate.latestDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          PDF öffnen
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {certificate ? (
          <CertificateBadgeCard
            certificateCode={certificate.certificateCode}
            holderName={certificate.holderName}
          />
        ) : null}
      </div>
    );
  }

  if (!attemptId) {
    return (
      <Card className="max-w-4xl">
        <CardHeader className="space-y-3">
          <CardTitle>Interne Kompetenzprüfung</CardTitle>
          <p className="text-sm leading-7 text-slate-600">
            Die Prüfung findet jetzt direkt im KI-Register statt. Inhalte und
            Bestehenslogik entsprechen dem bisherigen Zertifizierungs-Setup.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Prüfung konnte nicht gestartet werden</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Prüfungsformat
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>{LEGACY_EXAM_DEFINITION.sections.length} Prüfungsabschnitte</li>
                <li>{TOTAL_QUESTIONS} Multiple-Choice-Fragen</li>
                <li>
                  {LEGACY_EXAM_DEFINITION.questionTimeLimitSeconds / 60} Minuten pro Frage
                </li>
                <li>
                  {LEGACY_EXAM_DEFINITION.passThreshold}% Mindestscore pro Abschnitt
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <Label htmlFor="exam-company" className="text-sm font-medium">
                Unternehmen für das Zertifikat
              </Label>
              <Input
                id="exam-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Optional"
                className="mt-3"
              />
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Wird nur verwendet, wenn das Zertifikat den Firmennamen anzeigen
                soll.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Abschnitte
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {LEGACY_EXAM_DEFINITION.sections.map((section) => (
                <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-950">{section.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {section.questions.length} Fragen
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartExam} disabled={isStarting}>
              {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Prüfung jetzt starten
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sectionReview) {
    const isLastSection =
      currentSectionIndex === LEGACY_EXAM_DEFINITION.sections.length - 1;

    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{sectionReview.sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Abschnittsergebnis {sectionReview.score.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">
                {sectionReview.correctAnswers}/{sectionReview.totalQuestions} korrekt
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                sectionReview.passed
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {sectionReview.passed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {sectionReview.passed ? 'Bestanden' : 'Unter Schwellwert'}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleRepeatSection}>
              Abschnitt wiederholen
            </Button>
            <Button onClick={handleContinueAfterSection} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLastSection ? 'Prüfung auswerten' : 'Zum nächsten Abschnitt'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prüfungsfehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Abschnitt {currentSectionIndex + 1} von {LEGACY_EXAM_DEFINITION.sections.length}
              </p>
              <h2 className="text-xl font-semibold text-slate-950">
                {currentSection.title}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
              <Clock3 className="h-4 w-4" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Gesamtfortschritt</span>
              <span>{examProgressPercent}%</span>
            </div>
            <Progress value={examProgressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl leading-tight">
            {currentQuestion.text}
          </CardTitle>
          <p className="text-sm text-slate-500">
            Frage {currentQuestionIndex + 1} von {currentSection.questions.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedAnswer !== null ? String(selectedAnswer) : ''}
            onValueChange={(value) => handleAnswerChange(Number(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === currentQuestion.correctAnswer;
              const isSelected = selectedAnswer === optionIndex;

              return (
                <Label
                  key={`${currentQuestion.id}-${optionIndex}`}
                  htmlFor={`${currentQuestion.id}-${optionIndex}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    showExplanation && isCorrect
                      ? 'border-gray-300 bg-gray-50'
                      : showExplanation && isSelected
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RadioGroupItem
                    id={`${currentQuestion.id}-${optionIndex}`}
                    value={String(optionIndex)}
                    disabled={showExplanation}
                    className="mt-1"
                  />
                  <span className="text-sm leading-7 text-slate-700">{option}</span>
                </Label>
              );
            })}
          </RadioGroup>

          {showExplanation ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {selectedAnswer === currentQuestion.correctAnswer
                  ? 'Antwort korrekt'
                  : 'Antwort geprüft'}
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{currentQuestion.explanation}</p>
                <Button onClick={() => handleAdvanceQuestion(false)}>
                  Nächste Frage
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-xs text-slate-500">
              Wählen Sie eine Antwort aus. Nach jeder Antwort sehen Sie die
              fachliche Einordnung.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
