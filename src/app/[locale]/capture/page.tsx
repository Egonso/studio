"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SignedInAreaFrame, PageStatePanel } from "@/components/product-shells";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DraftAssistPanel } from "@/components/draft-assist/draft-assist-panel";
import { invalidateEntitlementCache } from "@/lib/compliance-engine/capability/useCapability";
import { useAuth } from "@/context/auth-context";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
import type { QuickCaptureFieldsDraft } from "@/components/register/quick-capture-fields";
import { CoverageAssistEntry } from "@/components/coverage-assist/coverage-assist-entry";
import {
  trackCoverageAssistCustomPurposeUsed,
  trackCoverageAssistDismissed,
  trackCoverageAssistEntryShown,
  trackCoverageAssistSuggestionSelected,
} from "@/lib/analytics/coverage-assist-events";
import { trackProductFunnelEvent } from "@/lib/analytics/product-funnel-client";
import {
  createCoverageAssistContextFromQuery,
} from "@/lib/coverage-assist/query-contract";
import { isCoverageAssistPilotEnabled } from "@/lib/coverage-assist/feature-gate";
import { resolveCoverageAssistEntryState } from "@/lib/coverage-assist/capture-entry";
import { buildCaptureInitialDraftFromDraftAssistHandoff } from "@/lib/draft-assist/capture-handoff";
import type { DraftAssistHandoff } from "@/lib/draft-assist/types";
import type {
  CaptureAssistContext,
  CoverageAssistSeedSuggestion,
} from "@/lib/coverage-assist/types";
import { syncRegisterEntitlement } from "@/lib/register-first/entitlement-client";
import { resolveCaptureEntryMode } from "@/lib/register-first/capture-entry-mode";
import { registerFirstFlags } from "@/lib/register-first/flags";
import {
  buildScopedRegisterHref,
  buildScopedUseCaseDetailHref,
} from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import {
  registerService,
  type RegisterServiceErrorCode,
} from "@/lib/register-first/register-service";

type OnboardingState = "loading" | "no_register" | "ready";
type CaptureInitialDraft = Partial<QuickCaptureFieldsDraft & { description: string }>;
type CaptureJourneySource =
  | "training_completion"
  | "training_landing"
  | "register_landing"
  | "invite";

function parseCaptureJourneySource(value: string | null): CaptureJourneySource | undefined {
  if (
    value === "training_completion" ||
    value === "training_landing" ||
    value === "register_landing" ||
    value === "invite"
  ) {
    return value;
  }
  return undefined;
}

function mapErrorCode(error: unknown): RegisterServiceErrorCode | null {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code) as RegisterServiceErrorCode;
  }
  return null;
}

export default function StandaloneCapturePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSearchParams = useMemo(
    () => searchParams ?? new URLSearchParams(),
    [searchParams]
  );
  const workspaceScope = useWorkspaceScope();
  const source = safeSearchParams.get("source");
  const captureJourneySource = parseCaptureJourneySource(source);
  const analyticsSessionId = safeSearchParams.get("journey");
  const prefill = (safeSearchParams.get("prefill") ?? "").trim();
  const originUrl = (safeSearchParams.get("originUrl") ?? "").trim();
  const checkoutSessionId = safeSearchParams.get("checkout_session_id");
  const [guestMode, setGuestMode] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [registerName, setRegisterName] = useState("Mein Register");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [syncedEntitlement, setSyncedEntitlement] = useState(false);
  const coverageAssistPilotEnabled = isCoverageAssistPilotEnabled(registerFirstFlags);
  const draftAssistCaptureEnabled = registerFirstFlags.draftAssistCapture;
  const draftAssistRequestedByQuery = safeSearchParams.get("assist") === "draft";
  const defaultInitialDraft = useMemo(
    () => ({
      purpose: prefill.slice(0, 160),
      description: originUrl ? `Quelle: ${originUrl}`.slice(0, 160) : "",
    }),
    [originUrl, prefill]
  );
  const assistEntryState = useMemo(
    () =>
      resolveCoverageAssistEntryState(safeSearchParams, {
        phase1Enabled: coverageAssistPilotEnabled,
        seedLibraryEnabled:
          coverageAssistPilotEnabled && registerFirstFlags.coverageAssistSeedLibrary,
      }),
    [coverageAssistPilotEnabled, safeSearchParams]
  );
  const initialEntryMode = resolveCaptureEntryMode({
    hasCoverageAssistEntry: assistEntryState !== null,
    draftAssistEnabled: draftAssistCaptureEnabled,
    draftAssistRequested: draftAssistRequestedByQuery,
  });
  const [captureOpen, setCaptureOpen] = useState(
    () => initialEntryMode === "direct"
  );
  const [draftAssistRequested, setDraftAssistRequested] = useState(
    initialEntryMode === "draft_assist"
  );
  const [assistDraft, setAssistDraft] = useState<CaptureInitialDraft | null>(null);
  const [assistContext, setAssistContext] = useState<CaptureAssistContext | null>(null);
  const assistOpenedSignatureRef = useRef<string | null>(null);
  const initialDraft = assistDraft ?? defaultInitialDraft;
  const shouldShowAssistEntry = assistEntryState !== null && assistDraft === null;
  const shouldShowDraftAssistEntry =
    draftAssistCaptureEnabled &&
    draftAssistRequested &&
    assistEntryState === null &&
    assistDraft === null &&
    !captureOpen;
  const isCaptureSurfaceReady = onboardingState === "ready" && (Boolean(user) || guestMode);

  // Check if user has a register on mount
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!assistEntryState || !shouldShowAssistEntry || !isCaptureSurfaceReady) {
      assistOpenedSignatureRef.current = null;
      return;
    }

    const signature = [
      assistEntryState.query.assistSource,
      assistEntryState.toolId,
      assistEntryState.matchedHost ?? "",
    ].join(":");

    if (assistOpenedSignatureRef.current === signature) {
      return;
    }

    assistOpenedSignatureRef.current = signature;
    trackCoverageAssistEntryShown({
      source: assistEntryState.query.assistSource,
      toolId: assistEntryState.toolId,
      matchedHost: assistEntryState.matchedHost,
      suggestionCount: assistEntryState.suggestions.length,
    });
  }, [assistEntryState, isCaptureSurfaceReady, shouldShowAssistEntry]);

  useEffect(() => {
    if (authLoading || hasChecked || !user) return;

    setHasChecked(true);
    registerService
      .listRegisters()
      .then((registers) => {
        setOnboardingState(registers.length > 0 ? "ready" : "no_register");
      })
      .catch((err) => {
        const code = mapErrorCode(err);
        if (code === "UNAUTHENTICATED") {
          router.push("/?mode=login");
        } else {
          setOnboardingState("no_register");
        }
      });
  }, [authLoading, hasChecked, router, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      setOnboardingState("ready");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || onboardingState !== "ready" || syncedEntitlement) {
      return;
    }

    setSyncedEntitlement(true);
    void syncRegisterEntitlement({ sessionId: checkoutSessionId })
      .then((result) => {
        if (result?.applied) {
          invalidateEntitlementCache();
        }
      })
      .catch((error) => {
        console.error("Capture entitlement sync failed:", error);
      });
  }, [checkoutSessionId, onboardingState, syncedEntitlement, user]);

  const handleCreateRegister = async () => {
    const name = registerName.trim();
    if (!name) return;

    setIsCreatingRegister(true);
    setCreateError(null);

    try {
      await registerService.createRegister(name);
      setOnboardingState("ready");
      const hasLocalCapture = (() => {
        try {
          return JSON.parse(
            window.localStorage.getItem("kiregister_guest_captures") ?? "[]",
          ).length > 0;
        } catch {
          return false;
        }
      })();
      if (captureJourneySource || hasLocalCapture) {
        void trackProductFunnelEvent({
          eventName: "register_created_after_capture",
          payload: {},
          context: {
            source: "capture",
            ...(analyticsSessionId
              ? { anonymousSessionId: analyticsSessionId }
              : {}),
          },
        });
      }
    } catch (err) {
      const code = mapErrorCode(err);
      setCreateError(
        code === "UNAUTHENTICATED"
          ? "Sie sind nicht angemeldet. Bitte melden Sie sich erneut an."
          : "Register konnte nicht erstellt werden. Bitte versuchen Sie es erneut."
      );
    } finally {
      setIsCreatingRegister(false);
    }
  };

  const closeCapture = () => {
    if (source === "chrome-extension" || source === "menubar-app") {
      try {
        window.close();
      } catch {
        // Ignore and fallback below.
      }
      return;
    }
    router.push(guestMode ? "/" : buildScopedRegisterHref(workspaceScope));
  };

  const handleModalChange = (nextOpen: boolean) => {
    setCaptureOpen(nextOpen);
    if (!nextOpen) {
      closeCapture();
    }
  };

  const buildAssistContext = (
    selectionMode: CaptureAssistContext["selectionMode"],
    seedSuggestion?: CoverageAssistSeedSuggestion | null
  ): CaptureAssistContext | null => {
    if (!assistEntryState) {
      return null;
    }

    return createCoverageAssistContextFromQuery(assistEntryState.query, {
      confidence: seedSuggestion ? "high" : "medium",
      selectionMode: selectionMode ?? null,
      seedSuggestionId: seedSuggestion?.suggestionId ?? null,
      seedSuggestionLabel: seedSuggestion?.label ?? null,
      libraryVersion: seedSuggestion?.libraryVersion ?? null,
    });
  };

  const openAssistCapture = (
    nextDraft: CaptureInitialDraft,
    nextAssistContext: CaptureAssistContext | null
  ) => {
    setAssistDraft(nextDraft);
    setAssistContext(nextAssistContext);
    setCaptureOpen(true);
  };

  const openManualCapture = () => {
    setDraftAssistRequested(false);
    setAssistDraft(null);
    setAssistContext(null);
    setCaptureOpen(true);
  };

  const openDraftAssist = () => {
    setDraftAssistRequested(true);
    setAssistDraft(null);
    setAssistContext(null);
    setCaptureOpen(false);
  };

  const handleDraftAssistAccepted = (handoff: DraftAssistHandoff) => {
    setAssistContext(null);
    setAssistDraft(buildCaptureInitialDraftFromDraftAssistHandoff(handoff));
    setCaptureOpen(true);
  };

  const handleAssistSuggestionSelected = (
    suggestion: CoverageAssistSeedSuggestion
  ) => {
    if (!assistEntryState) {
      return;
    }

    trackCoverageAssistSuggestionSelected({
      source: assistEntryState.query.assistSource,
      toolId: assistEntryState.toolId,
      seedSuggestionId: suggestion.suggestionId,
      libraryVersion: suggestion.libraryVersion,
    });

    openAssistCapture(
      {
        toolId: assistEntryState.toolId,
        purpose: suggestion.purposeDraft,
      },
      buildAssistContext("seed_suggestion", suggestion)
    );
  };

  const handleAssistCustomPurpose = (purpose: string) => {
    if (!assistEntryState) {
      return;
    }

    trackCoverageAssistCustomPurposeUsed({
      source: assistEntryState.query.assistSource,
      toolId: assistEntryState.toolId,
    });

    openAssistCapture(
      {
        toolId: assistEntryState.toolId,
        purpose: purpose.trim().slice(0, 160),
      },
      buildAssistContext("custom_purpose")
    );
  };

  const handleAssistContinueWithoutSuggestion = () => {
    if (!assistEntryState) {
      return;
    }

    if (assistEntryState.suggestions.length > 0) {
      trackCoverageAssistDismissed({
        source: assistEntryState.query.assistSource,
        toolId: assistEntryState.toolId,
        matchedHost: assistEntryState.matchedHost,
      });
    }

    openAssistCapture(
      {
        toolId: assistEntryState.toolId,
      },
      buildAssistContext("tool_only")
    );
  };

  const handleCaptured = (useCaseId?: string) => {
    if (source === "chrome-extension" || source === "menubar-app") {
      closeCapture();
      return;
    }
    if (useCaseId) {
      router.push(buildScopedUseCaseDetailHref(useCaseId, workspaceScope));
      return;
    }
    closeCapture();
  };

  if (authLoading || onboardingState === "loading") {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="KI-Einsatzfall erfassen"
        description="Erfassen Sie neue KI-Einsatzfälle direkt im Register."
        nextStep="Die Erfassung wird vorbereitet."
        width="5xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title="Erfassung wird geladen"
          description="Registerkontext und Erfassungsformular werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (onboardingState === "no_register") {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="KI-Einsatzfall erfassen"
        description="Erfassen Sie neue KI-Einsatzfälle direkt im Register."
        nextStep="Legen Sie zuerst ein Register an."
        width="5xl"
      >
        <div className="space-y-6">
          <PageStatePanel
            area="signed_in_free_register"
            title="Es fehlt noch ein Register"
            description="Bevor Sie einen Einsatzfall erfassen, legen Sie Ihren ersten Register-Arbeitsbereich an."
          />
          <Card className="mx-auto w-full max-w-md">
            <CardHeader>
              <CardTitle>Erstes Register anlegen</CardTitle>
              <CardDescription>
                Ein Register sammelt Ihre KI-Einsatzfälle. Weitere Register können später ergänzt werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="registerName">Name des Registers</Label>
                <Input
                  id="registerName"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="z. B. Mein Register"
                />
              </div>
              <Button
                onClick={() => void handleCreateRegister()}
                disabled={isCreatingRegister || !registerName.trim()}
                className="w-full"
              >
                {isCreatingRegister && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register erstellen
              </Button>
            </CardContent>
          </Card>
        </div>
      </SignedInAreaFrame>
    );
  }

  if (!user && !guestMode) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="KI-Einsatzfall erfassen"
        description="Ein KI-Einsatzfall wird in rund 30 Sekunden erfasst — System, Zweck, Verantwortung. Daraus entsteht ein Eintrag im KI-Register Ihrer Organisation."
        nextStep="Direkt ausprobieren oder anmelden und ins Register speichern."
        width="5xl"
      >
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>Ersten KI-Einsatzfall erfassen</CardTitle>
              <CardDescription>
                Drei kurze Felder, keine Vorkenntnisse nötig. Sie können sofort
                loslegen — ein Konto brauchen Sie erst, wenn der Eintrag ins
                Register Ihrer Organisation soll.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="h-11 w-full"
                onClick={() => {
                  setGuestMode(true);
                }}
              >
                Direkt ausprobieren — ohne Anmeldung
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => {
                  router.push("/login?mode=login");
                }}
              >
                Anmelden und ins Register speichern
              </Button>
              <p className="text-xs text-muted-foreground">
                Ohne Anmeldung werden Einträge lokal in diesem Browser
                gespeichert und lassen sich später in ein Register übernehmen.
                Mit Einladungslink Ihres Teams landet der Eintrag direkt im
                richtigen Register.
              </p>
              <div className="grid gap-2 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                <p>
                  <span className="font-medium text-foreground">1 · Erfassen</span>
                  <br />
                  System, Zweck, Daten — ca. 30 Sekunden.
                </p>
                <p>
                  <span className="font-medium text-foreground">2 · Prüfen</span>
                  <br />
                  Risikohinweise unterstützen, ein Mensch bestätigt.
                </p>
                <p>
                  <span className="font-medium text-foreground">3 · Nachweisen</span>
                  <br />
                  Dokumentationsstand als Use Case Pass teilen (PDF/JSON).
                </p>
              </div>
            </CardContent>
          </Card>

          <a
            href="/resources/examples/ki-register-use-case-pass-beispiel.pdf"
            target="_blank"
            rel="noreferrer"
            className="group block border bg-card p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Daraus wird
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Ein Use Case Pass — der teilbare Dokumentationsstand
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/use-case-pass-example.png"
              alt="Beispiel eines Use Case Pass als PDF"
              className="mt-3 max-h-72 w-full border object-cover object-top"
              loading="lazy"
            />
            <p className="mt-2 text-xs text-muted-foreground underline-offset-4 group-hover:underline">
              Beispiel-PDF öffnen
            </p>
          </a>
        </div>
      </SignedInAreaFrame>
    );
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title="KI-Einsatzfall erfassen"
      description="Erfassen Sie einen neuen KI-Einsatzfall in wenigen Feldern und führen Sie ihn danach im Register weiter."
      nextStep={
        shouldShowAssistEntry
          ? "Klären Sie zuerst den Zweck, bevor der Einsatzfall in die Erfassung übernommen wird."
          : "Dokumentieren Sie zuerst Zweck, Tool und Nutzungskontext."
      }
      width="5xl"
    >
      {shouldShowAssistEntry && assistEntryState ? (
        <CoverageAssistEntry
          toolName={assistEntryState.toolName}
          matchedHost={assistEntryState.matchedHost}
          suggestions={assistEntryState.suggestions}
          onSelectSuggestion={handleAssistSuggestionSelected}
          onSubmitCustomPurpose={handleAssistCustomPurpose}
          onContinueWithoutSuggestion={handleAssistContinueWithoutSuggestion}
        />
      ) : null}

      {shouldShowDraftAssistEntry ? (
        <DraftAssistPanel
          mode={user ? "register" : "guest"}
          workspaceId={workspaceScope}
          onStartManualCapture={openManualCapture}
          onAcceptHandoff={handleDraftAssistAccepted}
        />
      ) : null}

      <QuickCaptureModal
        open={captureOpen}
        onOpenChange={handleModalChange}
        onCaptured={handleCaptured}
        mode={user ? "register" : "guest"}
        renderInline
        initialDraft={initialDraft}
        assistContext={assistContext}
        showSuccessReceipt
        captureSource={captureJourneySource}
        analyticsSessionId={analyticsSessionId}
        captureMode={
          assistContext?.assist === "coverage"
            ? "coverage_assist"
            : assistDraft
              ? "description_assist"
              : "direct"
        }
        onStartDraftAssist={
          draftAssistCaptureEnabled ? openDraftAssist : undefined
        }
      />
    </SignedInAreaFrame>
  );
}
