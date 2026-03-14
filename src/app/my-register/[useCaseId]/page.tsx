'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { UseCaseHeader } from '@/components/register/detail/use-case-header';
import { RegisterStatusPill } from '@/components/register/detail/status-pill';
import { UseCaseMetadataSection } from '@/components/register/detail/use-case-metadata-section';
import { UseCaseSystemsComplianceSection } from '@/components/register/detail/use-case-systems-compliance-section';
import { UseCaseWorkflowSection } from '@/components/register/detail/use-case-workflow-section';
import { GovernanceLiabilitySection } from '@/components/register/detail/governance-liability-section';
import { ReviewSection } from '@/components/register/detail/review-section';
import { AuditTrailSection } from '@/components/register/detail/audit-trail-section';
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
  getUseCaseSystemSectionMode,
  getUseCaseSystemsSummary,
} from '@/lib/register-first';
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
  const [activeFocus, setActiveFocus] = useState<ControlFocusTarget | null>(
    null,
  );
  const [invalidFocus, setInvalidFocus] = useState<string | null>(null);

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
      ? 'Prüfen Sie die externe Einreichung und entscheiden Sie über Übernahme, Ablehnung oder Review.'
      : 'Pflegen Sie Dokumentation, Review und Governance-Details auf Basis der bereits verarbeiteten Herkunft.'
    : card?.origin?.source === 'manual'
      ? 'Ergänzen Sie Dokumentation, Review und Nachweise für diesen manuell angelegten Use Case.'
      : 'Prüfen Sie Herkunft, Review und Governance-Details für diesen Use Case.';
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
    if (resolvedFocus !== 'owner') return;
    setIsEditing(true);
  }, [editParam, resolvedFocus, useCaseId]);

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
    >
      <div className="space-y-10">
        <UseCaseHeader
          card={card}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((prev) => !prev)}
          onRefresh={loadUseCase}
        />

        {isEditing ? (
          <UseCaseEditContextBar
            purpose={card.purpose}
            status={card.status}
            systemsSummary={systemsSummary}
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

        <UseCaseMetadataSection
          card={card}
          isEditing={isEditing}
          onSave={handleSaveMetadata}
          focusTarget={activeFocus}
        />

        {systemSectionMode === 'multi' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
            <div className="space-y-1">
              <h2 className="text-[18px] font-semibold tracking-tight">
                Systemlandschaft
              </h2>
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
            />
          </div>
        )}

        {registerFirstFlags.controlShell && (
          <div
            id="usecase-focus-governance"
            className={
              activeFocus === 'governance' ? focusHighlightClassName : undefined
            }
          >
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
          </div>
        )}

        <div
          id="usecase-focus-review"
          className={
            activeFocus === 'review' ? focusHighlightClassName : undefined
          }
        >
          <ReviewSection card={card} onStatusChange={handleStatusChange} />
        </div>
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
  onCancel,
}: {
  purpose: string;
  status: RegisterUseCaseStatus;
  systemsSummary: string;
  onCancel: () => void;
}) {
  return (
    <div className="sticky top-3 z-20 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
  if (focus === 'owner') return 'usecase-focus-owner';
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
