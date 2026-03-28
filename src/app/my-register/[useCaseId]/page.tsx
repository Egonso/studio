'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { UseCaseHeader } from '@/components/register/detail/use-case-header';
import { RegisterStatusPill } from '@/components/register/detail/status-pill';
import { UseCaseAssessmentWizard } from '@/components/register/detail/use-case-assessment-wizard';
import type { RiskReviewLaunchContext } from '@/components/register/detail/use-case-assessment-wizard-model';
import { UseCaseMetadataSection } from '@/components/register/detail/use-case-metadata-section';
import { UseCaseSystemsComplianceSection } from '@/components/register/detail/use-case-systems-compliance-section';
import { UseCaseWorkflowSection } from '@/components/register/detail/use-case-workflow-section';
import { GovernanceLiabilitySection } from '@/components/register/detail/governance-liability-section';
import { ReviewSection } from '@/components/register/detail/review-section';
import { AuditTrailSection } from '@/components/register/detail/audit-trail-section';
import { ProofReadinessSummary } from '@/components/register/detail/proof-readiness-summary';
import { Button } from '@/components/ui/button';
import {
  isGovernanceRepairField,
  isControlFocusTarget,
  type ControlFocusTarget,
} from '@/lib/control/deep-link';
import { buildScopedRegisterHref } from '@/lib/navigation/workspace-scope';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  createAiToolsRegistryService,
  computeUseCaseReadiness,
  getUseCaseSystemSectionMode,
  getUseCaseSystemsSummary,
  type UseCaseReadinessResult,
} from '@/lib/register-first';
import { cn } from '@/lib/utils';
import { externalSubmissionService } from '@/lib/register-first/external-submission-service';
import { parseRegisterScopeFromWorkspaceValue } from '@/lib/register-first/register-scope';
import { registerService } from '@/lib/register-first/register-service';
import type {
  ExternalSubmission,
  OrgSettings,
  RegisterUseCaseStatus,
  UseCaseCard,
} from '@/lib/register-first/types';
import { setActiveWorkspaceId } from '@/lib/workspace-session';

const aiRegistry = createAiToolsRegistryService();

export default function UseCaseDetailPage() {
  const params = useParams<{ useCaseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceScope = useWorkspaceScope();
  const { user, loading: authLoading } = useAuth();

  const [card, setCard] = useState<UseCaseCard | null>(null);
  const [relatedSubmission, setRelatedSubmission] =
    useState<ExternalSubmission | null>(null);
  const [allUseCases, setAllUseCases] = useState<UseCaseCard[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRiskReviewOpen, setIsRiskReviewOpen] = useState(false);
  const [riskReviewContext, setRiskReviewContext] =
    useState<RiskReviewLaunchContext | null>(null);
  const [showDesktopEditBar, setShowDesktopEditBar] = useState(false);
  const [activeFocus, setActiveFocus] = useState<ControlFocusTarget | null>(
    null,
  );
  const [invalidFocus, setInvalidFocus] = useState<string | null>(null);
  const heroBoundaryRef = useRef<HTMLDivElement | null>(null);

  const useCaseId = params.useCaseId;
  const focusParam = searchParams.get('focus');
  const editParam = searchParams.get('edit');
  const fieldParam = searchParams.get('field');
  const scopeContext = useMemo(
    () => parseRegisterScopeFromWorkspaceValue(workspaceScope),
    [workspaceScope],
  );
  const requestedFocus = isControlFocusTarget(focusParam) ? focusParam : null;
  const resolvedFocus = resolveFocusTarget(requestedFocus);
  const governanceField = resolveGovernanceField(requestedFocus, fieldParam);
  const governanceAutoOpenField =
    editParam === '1' &&
    (governanceField === 'oversight' || governanceField === 'reviewCycle')
      ? governanceField
      : null;
  const detailNextStep = relatedSubmission
    ? relatedSubmission.status === 'submitted'
      ? 'Externe Einreichung prüfen und über Übernahme, Ablehnung oder Review entscheiden.'
      : 'Dokumentation, Review und Governance-Details auf Basis der vorhandenen Herkunft ergänzen.'
    : card?.origin?.source === 'manual'
      ? 'Dokumentation, Review und Nachweise ergänzen, damit der Einsatzfall formal prüfbar wird.'
      : 'Herkunft, Review und Governance-Details prüfen und dokumentieren.';
  const systemSectionMode = useMemo(
    () =>
      card
        ? getUseCaseSystemSectionMode(card, {
            resolveToolName: (toolId) =>
              aiRegistry.getById(toolId)?.productName ?? null,
          })
        : 'single',
    [card],
  );
  const systemsSummary = useMemo(
    () =>
      card
        ? getUseCaseSystemsSummary(card, {
            resolveToolName: (toolId) =>
              aiRegistry.getById(toolId)?.productName ?? null,
            emptyLabel: 'Kein System',
          })
        : 'Kein System',
    [card],
  );
  const readiness = useMemo(
    () => (card ? computeUseCaseReadiness(card, orgSettings) : null),
    [card, orgSettings],
  );
  const systemsStageHint = readiness ? getSystemsStageHint(readiness) : null;
  const [showGovernanceSection, setShowGovernanceSection] = useState(false);
  const [showSystemsSection, setShowSystemsSection] = useState(false);
  const [showReviewSection, setShowReviewSection] = useState(false);
  const governancePresentation = readiness
    ? resolveStepPresentation(readiness, 'groundProofs')
    : 'active';
  const systemsPresentation = readiness
    ? resolveStepPresentation(readiness, 'systemEvidence')
    : 'upcoming';
  const reviewPresentation = readiness
    ? resolveStepPresentation(readiness, 'formalReview')
    : 'upcoming';
  const isGovernanceExpanded =
    governancePresentation === 'active' ||
    activeFocus === 'governance' ||
    showGovernanceSection;
  const isSystemsExpanded =
    systemsPresentation === 'active' ||
    activeFocus === 'systems' ||
    showSystemsSection;
  const isReviewExpanded =
    reviewPresentation === 'active' ||
    activeFocus === 'review' ||
    showReviewSection;

  const loadUseCase = useCallback(async () => {
    if (!useCaseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [result, register, useCases] = await Promise.all([
        registerService.getUseCase(undefined, useCaseId, scopeContext),
        registerFirstFlags.controlShell
          ? registerService.getFirstRegister(scopeContext).catch(() => null)
          : Promise.resolve(null),
        registerFirstFlags.controlShell
          ? registerService
              .listUseCases(undefined, { includeDeleted: false }, scopeContext)
              .catch(() => [])
          : Promise.resolve([]),
      ]);
      if (!result) {
        setRelatedSubmission(null);
        setError('Einsatzfall nicht gefunden.');
      } else {
        const related =
          result.origin?.source !== 'manual' &&
          result.externalIntake?.registerId
            ? await externalSubmissionService
                .findRelatedToUseCase({
                  registerId: result.externalIntake.registerId,
                  useCaseId: result.useCaseId,
                  submissionId:
                    result.origin?.sourceRequestId ??
                    result.externalIntake?.submissionId ??
                    null,
                  scopeContext,
                })
                .catch(() => null)
            : null;
        setCard(result);
        setRelatedSubmission(related);
        setAllUseCases(useCases);
        setOrgSettings(register?.orgSettings ?? null);
      }
    } catch (err) {
      setRelatedSubmission(null);
      if (isServiceError(err, 'UNAUTHENTICATED')) {
        router.push('/login');
        return;
      }
      if (isServiceError(err, 'REGISTER_NOT_FOUND')) {
        setError('Kein Register gefunden. Bitte erstelle zuerst ein Register.');
      } else {
        setError('Einsatzfall konnte nicht geladen werden.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [scopeContext, useCaseId, router]);

  useEffect(() => {
    setActiveWorkspaceId(
      scopeContext.kind === 'workspace' ? scopeContext.workspaceId ?? null : null,
    );
  }, [scopeContext]);

  useEffect(() => {
    if (editParam !== '1') return;
    if (resolvedFocus !== 'owner' && resolvedFocus !== 'metadata') return;
    setIsEditing(true);
  }, [editParam, resolvedFocus, useCaseId]);

  useEffect(() => {
    if (!isEditing) {
      setShowDesktopEditBar(false);
      return;
    }

    const boundary = heroBoundaryRef.current;
    if (!boundary || typeof IntersectionObserver === 'undefined') {
      setShowDesktopEditBar(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowDesktopEditBar(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '-92px 0px 0px 0px',
      },
    );

    observer.observe(boundary);
    return () => observer.disconnect();
  }, [isEditing, card?.useCaseId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      void loadUseCase();
    }
  }, [authLoading, user, loadUseCase, router]);

  useEffect(() => {
    if (!card) return;

    if (!focusParam) {
      setActiveFocus(null);
      setInvalidFocus(null);
      return;
    }

    if (!requestedFocus || !resolvedFocus) {
      setActiveFocus(null);
      setInvalidFocus(focusParam);
      return;
    }

    setInvalidFocus(null);
    setActiveFocus(resolvedFocus);

    const focusTargetId = getFocusTargetId(resolvedFocus);
    const frameId = window.requestAnimationFrame(() => {
      const element = document.getElementById(focusTargetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const timeoutId = window.setTimeout(() => {
      setActiveFocus((current) => (current === resolvedFocus ? null : current));
    }, 2600);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [card, focusParam, requestedFocus, resolvedFocus]);

  const handleStatusChange = async (
    nextStatus: RegisterUseCaseStatus,
    reason?: string,
  ) => {
    if (!card) return;
    await registerService.updateUseCaseStatusManual({
      useCaseId: card.useCaseId,
      nextStatus,
      reason,
      actor: 'HUMAN',
      scopeContext,
    });
    await loadUseCase();
  };

  const handleSaveMetadata = async (updates: Partial<UseCaseCard>) => {
    if (!card) return;
    try {
      await registerService.updateUseCase(card.useCaseId, updates, scopeContext);
      await loadUseCase();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save metadata', err);
      // We don't necessarily want to replace the whole page with an error,
      // but if we do, setting error works:
      setError('Fehler beim Speichern der Änderungen.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="Use Case im Register"
        description="Detailansicht für Dokumentation, Reviews, Herkunft und Timeline."
        nextStep="Wir laden Dokumentation, Review-Kontext und Timeline."
        width="5xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title="Use Case wird geladen"
          description="Details, Timeline und Review-Kontext werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (error) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="Use Case im Register"
        description="Detailansicht für Dokumentation, Reviews, Herkunft und Timeline."
        nextStep="Öffnen Sie das Register oder laden Sie den Use Case erneut."
        width="5xl"
      >
        <PageStatePanel
          tone="error"
          area="signed_in_free_register"
          title="Use Case konnte nicht geladen werden"
          description={error}
          actions={
            <Button asChild variant="outline">
              <Link href={buildScopedRegisterHref(workspaceScope)}>
                Zurück zum Register
              </Link>
            </Button>
          }
        />
      </SignedInAreaFrame>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title="Use Case im Register"
      description="Dokumentieren, reviewen und Herkunft nachvollziehen in einer gemeinsamen Detailansicht."
      nextStep={detailNextStep}
      width="5xl"
      headerMode="hidden"
    >
      <div
        className={cn(
          'space-y-10',
          isEditing && 'pb-24 md:pb-0',
        )}
      >
        <UseCaseHeader
          card={card}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((prev) => !prev)}
          onRefresh={loadUseCase}
        />
        <div ref={heroBoundaryRef} className="h-px" />

        {readiness ? (
          <ProofReadinessSummary
            readiness={readiness}
            useCaseId={card.useCaseId}
            workspaceScope={workspaceScope}
          />
        ) : null}

        {isEditing ? (
          <UseCaseEditContextBar
            purpose={card.purpose}
            status={card.status}
            systemsSummary={systemsSummary}
            visible={showDesktopEditBar}
            onCancel={() => setIsEditing(false)}
          />
        ) : null}

        {invalidFocus && (
          <div className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600">
            <p className="font-medium">Hinweis</p>
            <p>
              Der Focus-Parameter "{invalidFocus}" ist nicht gueltig und wurde
              ignoriert.
            </p>
          </div>
        )}

        {registerFirstFlags.controlShell && (
          <div
            id="usecase-focus-governance"
            className={
              activeFocus === 'governance' ? focusHighlightClassName : undefined
            }
          >
            {readiness && !isGovernanceExpanded ? (
              <CompactStepShell
                title="1. Grundnachweise"
                description="Erster Baustein des Nachweisstatus."
                statusLabel={getStepPresentationLabel(governancePresentation)}
                hint={getGovernanceCompactHint(readiness)}
                onOpen={() => setShowGovernanceSection(true)}
              />
            ) : (
              <GovernanceLiabilitySection
                card={card}
                useCases={allUseCases.length > 0 ? allUseCases : [card]}
                orgSettings={orgSettings}
                focusField={activeFocus === 'governance' ? governanceField : null}
                autoOpenField={
                  activeFocus === 'governance' ? governanceAutoOpenField : null
                }
                onCardUpdate={() => {
                  void loadUseCase();
                }}
              />
            )}
          </div>
        )}

        <div
          id="usecase-focus-systems"
          className={
            activeFocus === 'systems' ? focusHighlightClassName : undefined
          }
        >
          {readiness && !isSystemsExpanded ? (
            <CompactStepShell
              title="2. Systemnachweis"
              description="Zweiter Baustein des Nachweisstatus."
              statusLabel={getStepPresentationLabel(systemsPresentation)}
              hint={getSystemsCompactHint(readiness)}
              onOpen={() => setShowSystemsSection(true)}
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-[18px] font-semibold tracking-tight">
                  2. Systemnachweis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Zweiter Baustein des Nachweisstatus. Dokumentiert beteiligte
                  Systeme und ihren Nachweisstand.
                </p>
                {systemsStageHint ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                      Als Naechstes
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {systemsStageHint}
                    </p>
                  </div>
                ) : null}
              </div>

              {systemSectionMode === 'multi' ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-semibold tracking-tight">
                      Systemlandschaft
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Verbindet die Ablauf-Sicht mit der deduplizierten
                      Compliance-Perspektive fuer alle beteiligten Systeme.
                    </p>
                  </div>

                  <div className="mt-6 space-y-6">
                    <UseCaseWorkflowSection
                      card={card}
                      onSave={handleSaveMetadata}
                      mode="multi"
                      layout="embedded"
                    />
                    <div className="border-t border-slate-200 pt-6">
                      <UseCaseSystemsComplianceSection
                        card={card}
                        isEditing={isEditing}
                        onSave={handleSaveMetadata}
                        mode="multi"
                        layout="embedded"
                        headingOverride="Nachweisstand je System"
                        descriptionOverride="Zeigt den dokumentierten Nachweisstand pro beteiligtem System."
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <div className="space-y-6">
                  <UseCaseWorkflowSection
                    card={card}
                    onSave={handleSaveMetadata}
                    mode="single"
                  />
                  <UseCaseSystemsComplianceSection
                    card={card}
                    isEditing={isEditing}
                    onSave={handleSaveMetadata}
                    mode="single"
                    headingOverride="Nachweisstand je System"
                    descriptionOverride="Zeigt den dokumentierten Nachweisstand fuer das aktuell gefuehrte System."
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div
          id="usecase-focus-review"
          className={
            activeFocus === 'review' ? focusHighlightClassName : undefined
          }
        >
          {readiness ? (
            !isReviewExpanded ? (
              <CompactStepShell
                title="3. Formale Pruefung"
                description="Letzter Baustein zur Nachweisfaehigkeit."
                statusLabel={getStepPresentationLabel(reviewPresentation)}
                hint={getReviewCompactHint(readiness)}
                onOpen={() => setShowReviewSection(true)}
              />
            ) : (
              <ReviewSection
                card={card}
                readiness={readiness}
                useCaseId={card.useCaseId}
                workspaceScope={workspaceScope}
                onStatusChange={handleStatusChange}
              />
            )
          ) : null}
        </div>
        <div
          id="usecase-focus-metadata"
          className={
            activeFocus === 'metadata' ? focusHighlightClassName : undefined
          }
        >
          <UseCaseMetadataSection
            card={card}
            isEditing={isEditing}
            onSave={handleSaveMetadata}
            focusTarget={activeFocus}
            onOpenRiskReview={(context) => {
              setRiskReviewContext(context);
              setIsRiskReviewOpen(true);
            }}
          />
        </div>

        <UseCaseAssessmentWizard
          card={card}
          open={isRiskReviewOpen}
          onOpenChange={(open) => {
            setIsRiskReviewOpen(open);
            if (!open) {
              setRiskReviewContext(null);
            }
          }}
          onComplete={loadUseCase}
          launchContext={riskReviewContext}
        />
        <div
          id="usecase-focus-audit"
          className={
            activeFocus === 'audit' ? focusHighlightClassName : undefined
          }
        >
          <AuditTrailSection card={card} submission={relatedSubmission} />
        </div>
      </div>
    </SignedInAreaFrame>
  );
}

function UseCaseEditContextBar({
  purpose,
  status,
  systemsSummary,
  visible,
  onCancel,
}: {
  purpose: string;
  status: RegisterUseCaseStatus;
  systemsSummary: string;
  visible: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 top-16 z-40 hidden transition-all duration-150 md:block',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
        )}
      >
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Bearbeitung aktiv
                  </span>
                  <RegisterStatusPill status={status} />
                </div>
                <p className="truncate text-sm font-medium text-slate-900">
                  {purpose}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {systemsSummary}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                  Abbrechen
                </Button>
                <Button type="submit" size="sm" form="use-case-metadata-form">
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              Bearbeitung aktiv
            </p>
            <p className="truncate text-sm font-medium text-slate-900">{purpose}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm" form="use-case-metadata-form">
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

const focusHighlightClassName = 'border-l-2 border-slate-300 pl-3';

function resolveFocusTarget(
  focus: ControlFocusTarget | null,
): ControlFocusTarget | null {
  if (focus === 'oversight') return 'governance';
  return focus;
}

function resolveGovernanceField(
  focus: ControlFocusTarget | null,
  field: string | null,
): 'oversight' | 'reviewCycle' | 'history' | null {
  if (focus === 'oversight') return 'oversight';
  return isGovernanceRepairField(field) ? field : null;
}

function getFocusTargetId(focus: ControlFocusTarget): string {
  if (focus === 'metadata') return 'usecase-focus-metadata';
  if (focus === 'owner') return 'usecase-focus-owner';
  if (focus === 'systems') return 'usecase-focus-systems';
  if (focus === 'governance') return 'usecase-focus-governance';
  if (focus === 'oversight') return 'usecase-focus-oversight';
  if (focus === 'policy') return 'usecase-focus-policy';
  if (focus === 'audit') return 'usecase-focus-audit';
  return 'usecase-focus-review';
}

function isServiceError(err: unknown, code: string): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    String((err as { code: unknown }).code) === code
  );
}

function getSystemsStageHint(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === 'proof_ready') {
    return 'Weiter zu 3. Formale Pruefung ist nicht mehr noetig; der Use-Case-Pass kann geoeffnet werden.';
  }

  if (readiness.nextStep?.key === 'groundProofs') {
    return 'Erst 1. Grundnachweise abschliessen.';
  }

  if (readiness.nextStep?.key === 'systemEvidence') {
    return 'Diesen Baustein vervollstaendigen.';
  }

  return 'Weiter zu 3. Formale Pruefung.';
}

type StepPresentation = 'active' | 'completed' | 'upcoming';

function resolveStepPresentation(
  readiness: UseCaseReadinessResult,
  stepKey: UseCaseReadinessResult['steps'][number]['key'],
): StepPresentation {
  const step = readiness.steps.find((candidate) => candidate.key === stepKey);
  if (!step) {
    return 'upcoming';
  }

  if (step.complete) {
    return 'completed';
  }

  if (readiness.nextStep?.key === step.key) {
    return 'active';
  }

  return 'upcoming';
}

function getStepPresentationLabel(presentation: StepPresentation): string {
  if (presentation === 'completed') return 'dokumentiert';
  if (presentation === 'active') return 'aktiv';
  return 'spaeter';
}

function getGovernanceCompactHint(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === 'proof_ready') {
    return 'Grundnachweise sind dokumentiert. Dieser Baustein bleibt bei Bedarf einsehbar.';
  }

  if (readiness.nextStep?.key === 'systemEvidence') {
    return 'Grundnachweise sind dokumentiert. Weiter zu 2. Systemnachweis.';
  }

  return 'Grundnachweise sind dokumentiert. Der Abschnitt bleibt bei Bedarf einsehbar.';
}

function getSystemsCompactHint(readiness: UseCaseReadinessResult): string {
  if (readiness.nextStep?.key === 'groundProofs') {
    return 'Wird aktiv, sobald 1. Grundnachweise dokumentiert sind.';
  }

  if (readiness.phase === 'proof_ready') {
    return 'Systemnachweis ist dokumentiert. Die formale Pruefung ist bereits abgeschlossen.';
  }

  return 'Systemnachweis ist dokumentiert. Weiter zu 3. Formale Pruefung.';
}

function getReviewCompactHint(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === 'proof_ready') {
    return 'Formale Pruefung ist dokumentiert. Der Status kann bei Bedarf neu bewertet werden.';
  }

  if (readiness.nextStep?.key === 'groundProofs') {
    return 'Wird aktiv, sobald 1. Grundnachweise und 2. Systemnachweis dokumentiert sind.';
  }

  if (readiness.nextStep?.key === 'systemEvidence') {
    return 'Wird aktiv, sobald 2. Systemnachweis dokumentiert ist.';
  }

  return 'Dieser Schritt ist jetzt aktiv und kann formal dokumentiert werden.';
}

function CompactStepShell({
  title,
  description,
  statusLabel,
  hint,
  onOpen,
}: {
  title: string;
  description: string;
  statusLabel: string;
  hint: string;
  onOpen: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
            <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-sm leading-6 text-slate-600">{hint}</p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
            {statusLabel}
          </p>
          <Button size="sm" variant="outline" onClick={onOpen}>
            Abschnitt anzeigen
          </Button>
        </div>
      </div>
    </section>
  );
}
