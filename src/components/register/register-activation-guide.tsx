'use client';

import { Check, Circle, MoveRight } from 'lucide-react';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { RegisterActivationSnapshot } from '@/lib/register-first/register-activation';

interface RegisterActivationGuideProps {
  snapshot: RegisterActivationSnapshot;
  onCapture: () => void;
  onOpenExternalInbox: () => void;
  onOpenUseCase: (useCaseId: string, focus?: string) => void;
}

function getCopy(locale: string) {
  if (locale === 'de') {
    return {
      eyebrow: 'Empfohlener nächster Schritt',
      titles: {
        capture_first: 'Ersten realen KI-Einsatzfall dokumentieren',
        external_submission: 'Externe Einreichung prüfen',
        assign_owner: 'Verantwortliche Rolle ergänzen',
        review_overdue: 'Überfälliges Review dokumentieren',
        review_due: 'Anstehendes Review vorbereiten',
        review_recommended: 'Empfohlenes Review fortsetzen',
        share_pass: 'Dokumentationsstand teilen',
        start_review: 'Erstes Review dokumentieren',
      },
      reasons: {
        no_use_cases:
          'Ohne einen realen Einsatzfall bleiben Register, Reviews und Nachweise abstrakt.',
        external_response_waiting:
          'Eine externe Antwort wartet auf eine interne Entscheidung.',
        owner_missing:
          'Der Einsatzfall hat noch keine nachvollziehbare Zuständigkeit.',
        review_overdue:
          'Das dokumentierte nächste Review-Datum ist überschritten.',
        review_due:
          'Das nächste Review ist innerhalb der kommenden 30 Tage fällig.',
        review_recommended:
          'Der dokumentierte Status verlangt eine menschliche Prüfung.',
        proof_ready:
          'Der Einsatzfall ist nachweisfähig, aber noch nicht als begrenzter öffentlicher Stand geteilt.',
        first_review:
          'Der Einsatzfall ist erfasst; als Nächstes fehlt die formale menschliche Prüfung.',
      },
      owner: 'Zuständig',
      openAction: 'Schritt öffnen',
      capture: 'KI-Einsatzfall erfassen',
      teamStart: 'Gemeinsamer Umsetzungsstart',
      useCases: '3 reale Einsatzfälle dokumentiert',
      owners: 'Verantwortliche Rollen zugewiesen',
      review: 'Mindestens ein Review abgeschlossen',
      pass: 'Einen begrenzten Pass geteilt',
    } as const;
  }

  return {
    eyebrow: 'Recommended next action',
    titles: {
      capture_first: 'Document the first real AI use case',
      external_submission: 'Review external submission',
      assign_owner: 'Add a responsible role',
      review_overdue: 'Document overdue review',
      review_due: 'Prepare upcoming review',
      review_recommended: 'Continue recommended review',
      share_pass: 'Share documentation state',
      start_review: 'Document the first review',
    },
    reasons: {
      no_use_cases: 'Without a real use case, register, reviews and evidence remain abstract.',
      external_response_waiting: 'An external response is waiting for an internal decision.',
      owner_missing: 'The use case does not yet have a traceable owner.',
      review_overdue: 'The documented next review date has passed.',
      review_due: 'The next review is due within 30 days.',
      review_recommended: 'The documented status requires human review.',
      proof_ready: 'The use case is evidence-ready but not yet shared as a scoped public state.',
      first_review: 'The use case is captured; formal human review is the next missing step.',
    },
    owner: 'Owner',
    openAction: 'Open action',
    capture: 'Capture AI use case',
    teamStart: 'Team activation start',
    useCases: '3 real use cases documented',
    owners: 'Responsible roles assigned',
    review: 'At least one review completed',
    pass: 'One scoped pass shared',
  } as const;
}

export function RegisterActivationGuide({
  snapshot,
  onCapture,
  onOpenExternalInbox,
  onOpenUseCase,
}: RegisterActivationGuideProps) {
  const locale = useLocale();
  const copy = getCopy(locale);
  const action = snapshot.nextAction;
  const progress = snapshot.progress;
  const checklist = [
    {
      label: copy.useCases,
      complete: progress.documentedUseCases >= progress.targetUseCases,
      value: `${Math.min(progress.documentedUseCases, progress.targetUseCases)}/${progress.targetUseCases}`,
    },
    {
      label: copy.owners,
      complete:
        progress.documentedUseCases > 0 &&
        progress.useCasesWithOwner >= progress.documentedUseCases,
      value: `${progress.useCasesWithOwner}/${progress.documentedUseCases}`,
    },
    {
      label: copy.review,
      complete: progress.completedReviews >= 1,
      value: `${progress.completedReviews}/1`,
    },
    {
      label: copy.pass,
      complete: progress.sharedPasses >= 1,
      value: `${progress.sharedPasses}/1`,
    },
  ];

  const handleAction = () => {
    if (action.kind === 'capture_first') {
      onCapture();
      return;
    }
    if (action.kind === 'external_submission') {
      onOpenExternalInbox();
      return;
    }
    if (!action.useCaseId) return;
    const focus =
      action.kind === 'assign_owner'
        ? 'owner'
        : action.kind === 'share_pass'
          ? 'audit'
          : 'governance';
    onOpenUseCase(action.useCaseId, focus);
  };

  return (
    <section className="border-y border-slate-200 bg-white py-5" aria-labelledby="activation-next-title">
      <div className="grid gap-6 px-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {copy.eyebrow}
          </p>
          <h2 id="activation-next-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {copy.titles[action.kind]}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.reasons[action.reasonKey]}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {copy.owner}: <span className="font-medium text-slate-700">{action.owner}</span>
          </p>
          <Button className="mt-5" onClick={handleAction}>
            {action.kind === 'capture_first' ? copy.capture : copy.openAction}
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="border-l-0 border-slate-200 lg:border-l lg:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {copy.teamStart}
          </p>
          <ol className="mt-3 space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="flex items-start gap-2 text-slate-700">
                  {item.complete ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-800" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  {item.label}
                </span>
                <span className="shrink-0 tabular-nums text-slate-500">{item.value}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
