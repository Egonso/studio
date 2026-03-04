"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type AimsProgress } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegisterTile } from "./dashboard/register-tile";
import { QuickCaptureModal } from "./register/quick-capture-modal";
import { accessCodeService } from "@/lib/register-first/access-code-service";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { evaluateControlUpgradeTriggers } from "@/lib/control/triggers";
import { trackTriggerClicked, trackTriggerShown } from "@/lib/analytics/control-events";
import { getPublicAppOrigin } from "@/lib/app-url";
import { type GetComplianceChecklistOutput } from "@/ai/flows/get-compliance-checklist";
import type { ComplianceItem, TrustPortalConfig } from "@/lib/types";
import type { UserStatus } from "@/hooks/use-user-status";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";

export interface ChecklistState {
  loading: boolean;
  error: string | null;
  data: GetComplianceChecklistOutput | null;
  checkedTasks: Record<string, boolean>;
}

export interface FullComplianceInfo extends ComplianceItem {
  checklistState: ChecklistState;
}

interface DashboardProps {
  projectName: string;
  complianceData: FullComplianceInfo[];
  setComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
  isoComplianceData: FullComplianceInfo[];
  setIsoComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
  portfolioComplianceData: FullComplianceInfo[];
  setPortfolioComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
  aimsData: unknown;
  aimsProgress: AimsProgress;
  wizardStatus: "not_started" | "in_progress" | "completed";
  policiesGenerated?: boolean;
  hasProjects?: boolean;
  userStatus?: UserStatus | null;
  userStatusLoading?: boolean;
  trustPortalConfig?: TrustPortalConfig;
  onTrustPortalUpdate?: (config: TrustPortalConfig) => void;
  useCases?: import("@/lib/register-first/types").UseCaseCard[];
  useCaseCount?: number;
  pendingReviewCount?: number;
  onUseCaseCaptured?: () => void;
  ownerId?: string;
  metrics?: import("@/lib/register-first/types").RegisterMetrics;
  register?: import("@/lib/register-first/types").Register | null;
}

const STATUS_ORDER: RegisterUseCaseStatus[] = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];

const STATUS_LABELS: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "Formale Prüfung ausstehend",
  REVIEW_RECOMMENDED: "Prüfung empfohlen",
  REVIEWED: "Prüfung abgeschlossen",
  PROOF_READY: "Nachweisfähig",
};

const STATUS_DOT_CLASS: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "bg-slate-400",
  REVIEW_RECOMMENDED: "bg-slate-500",
  REVIEWED: "bg-blue-500",
  PROOF_READY: "bg-emerald-500",
};

export function Dashboard({
  useCases = [],
  useCaseCount = 0,
  pendingReviewCount = 0,
  onUseCaseCaptured,
  register = null,
}: DashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const shownTriggerSignatureRef = useRef<string | null>(null);

  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [supplierLinkCopied, setSupplierLinkCopied] = useState(false);

  const statusCounts = useMemo(() => {
    const initial: Record<RegisterUseCaseStatus, number> = {
      UNREVIEWED: 0,
      REVIEW_RECOMMENDED: 0,
      REVIEWED: 0,
      PROOF_READY: 0,
    };

    for (const useCase of useCases) {
      initial[useCase.status] = (initial[useCase.status] ?? 0) + 1;
    }

    return initial;
  }, [useCases]);

  const effectiveTotal = useCases.length > 0 ? useCases.length : useCaseCount;
  const upgradeDecision = useMemo(
    () => evaluateControlUpgradeTriggers(useCases, register?.orgSettings),
    [useCases, register?.orgSettings]
  );
  const triggerIds = useMemo(
    () => upgradeDecision.triggers.map((trigger) => trigger.id),
    [upgradeDecision]
  );
  const triggerSignature = useMemo(
    () => [...triggerIds].sort().join(","),
    [triggerIds]
  );

  useEffect(() => {
    if (!registerFirstFlags.controlShell) return;
    if (!registerFirstFlags.controlUpgradeTriggers) return;
    if (!registerFirstFlags.controlAnalytics) return;
    if (!upgradeDecision.shouldPrompt) return;
    if (shownTriggerSignatureRef.current === triggerSignature) return;

    shownTriggerSignatureRef.current = triggerSignature;
    trackTriggerShown({
      triggerIds,
      triggerCount: triggerIds.length,
      source: "register_overview",
      useCaseCount: useCases.length,
    });
  }, [upgradeDecision.shouldPrompt, triggerIds, triggerSignature, useCases.length]);

  const handleGovernanceProfessionalization = () => {
    if (registerFirstFlags.controlAnalytics) {
      trackTriggerClicked({
        triggerIds,
        triggerCount: triggerIds.length,
        source: "register_overview",
        useCaseCount: useCases.length,
      });
    }

    const triggerQuery = encodeURIComponent(triggerIds.join(","));
    router.push(`/control?entry=trigger&triggerIds=${triggerQuery}`);
  };

  const handleSupplierRequest = async () => {
    if (!register?.registerId) {
      toast({
        variant: "destructive",
        title: "Keine Registerinstanz aktiv",
        description: "Öffnen Sie zuerst ein Register, um einen Anfrage-Link zu erstellen.",
      });
      return;
    }

    const link = `${getPublicAppOrigin()}/request/${register.registerId}`;
    try {
      await navigator.clipboard.writeText(link);
      setSupplierLinkCopied(true);
      window.setTimeout(() => {
        setSupplierLinkCopied(false);
      }, 2200);
      toast({
        title: "Anfrage-Link kopiert",
        description: "Der Lieferanten-Link wurde in die Zwischenablage kopiert.",
      });
    } catch {
      setSupplierLinkCopied(false);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Link konnte nicht kopiert werden.",
      });
    }
  };

  const handleShareCaptureLink = async () => {
    if (!register?.registerId) {
      toast({
        variant: "destructive",
        title: "Keine Registerinstanz aktiv",
        description: "Öffnen Sie zuerst ein Register, um einen Erfassungslink zu erstellen.",
      });
      return;
    }

    try {
      const codes = await accessCodeService.listCodes(register.registerId);
      const activeCode = codes.find(
        (code) => code.isActive && (!code.expiresAt || new Date(code.expiresAt) > new Date())
      );

      const resolvedCode = activeCode
        ? activeCode.code
        : (
            await accessCodeService.generateCode(register.registerId, {
              label: "Utility Link",
              expiryOption: "90_DAYS",
            })
          ).code;

      const captureLink = `${getPublicAppOrigin()}/erfassen?code=${encodeURIComponent(resolvedCode)}`;
      await navigator.clipboard.writeText(captureLink);
      toast({
        title: "Erfassungslink kopiert",
        description: "Der Link wurde in die Zwischenablage kopiert.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Erfassungslink konnte nicht erstellt werden.",
      });
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-6xl mx-auto space-y-8">
        <section>
          <RegisterTile
            projectId={searchParams.get("projectId") || ""}
            useCaseCount={useCaseCount}
            pendingReviewCount={pendingReviewCount}
            onCaptureClick={() => setIsQuickCaptureOpen(true)}
            onSupplierRequestClick={handleSupplierRequest}
            onShareCaptureLinkClick={handleShareCaptureLink}
            utilitiesDisabled={!register?.registerId}
            isSupplierLinkCopied={supplierLinkCopied}
          />
          <QuickCaptureModal
            open={isQuickCaptureOpen}
            onOpenChange={setIsQuickCaptureOpen}
            onCaptured={() => {
              setIsQuickCaptureOpen(false);
              onUseCaseCaptured?.();
            }}
          />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Status-Workflow</CardTitle>
              <CardDescription>
                Aktueller Dokumentationsstand im Register.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {effectiveTotal === 0 ? (
                <div className="flex items-start gap-2 text-sm text-muted-foreground rounded-md border border-dashed p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Noch keine dokumentierten KI-Einsatzfälle vorhanden.</span>
                </div>
              ) : (
                <>
                  {STATUS_ORDER.map((status) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[status]}`} />
                        <span>{STATUS_LABELS[status]}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">{statusCounts[status] ?? 0}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="pt-2">
                <Link
                  href="/my-register"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Register öffnen
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {registerFirstFlags.controlShell &&
          registerFirstFlags.controlUpgradeTriggers &&
          upgradeDecision.shouldPrompt && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Governance-Hinweis</CardTitle>
                <CardDescription>{upgradeDecision.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {upgradeDecision.triggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <p>{trigger.label}</p>
                      <p className="text-xs text-muted-foreground">{trigger.evidence}</p>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGovernanceProfessionalization}
                >
                  {upgradeDecision.ctaLabel}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
