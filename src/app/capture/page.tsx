"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SignedInAreaFrame, PageStatePanel } from "@/components/product-shells";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { invalidateEntitlementCache } from "@/lib/compliance-engine/capability/useCapability";
import { useAuth } from "@/context/auth-context";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
import { syncRegisterEntitlement } from "@/lib/register-first/entitlement-client";
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
  const workspaceScope = useWorkspaceScope();
  const source = searchParams.get("source");
  const prefill = (searchParams.get("prefill") ?? "").trim();
  const originUrl = (searchParams.get("originUrl") ?? "").trim();
  const checkoutSessionId = searchParams.get("checkout_session_id");
  const [captureOpen, setCaptureOpen] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [registerName, setRegisterName] = useState("Mein Register");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [syncedEntitlement, setSyncedEntitlement] = useState(false);
  const initialDraft = useMemo(
    () => ({
      purpose: prefill.slice(0, 160),
      description: originUrl ? `Quelle: ${originUrl}`.slice(0, 160) : "",
    }),
    [originUrl, prefill]
  );

  // Check if user has a register on mount
  const [hasChecked, setHasChecked] = useState(false);

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
    } catch (err) {
      const code = mapErrorCode(err);
      setCreateError(
        code === "UNAUTHENTICATED"
          ? "Du bist nicht angemeldet. Bitte melde dich erneut an."
          : "Register konnte nicht erstellt werden. Bitte versuche es erneut."
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
        title="Quick Capture"
        description="Erfassen Sie neue KI-Einsatzfälle direkt im Register."
        nextStep="Quick Capture wird vorbereitet."
        width="5xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title="Quick Capture wird geladen"
          description="Registerkontext und Erfassungsformular werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (onboardingState === "no_register") {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="Quick Capture"
        description="Erfassen Sie neue KI-Einsatzfälle direkt im Register."
        nextStep="Legen Sie zuerst ein Register an."
        width="5xl"
      >
        <div className="space-y-6">
          <PageStatePanel
            area="signed_in_free_register"
            title="Es fehlt noch ein Register"
            description="Bevor Sie Quick Capture nutzen, legen Sie Ihren ersten Register-Arbeitsbereich an."
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
        title="Quick Capture"
        description="Der direkte Weg, um einen neuen KI-Einsatzfall zu dokumentieren."
        nextStep="Melden Sie sich an, um direkt ins Register zu speichern."
        width="5xl"
      >
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Quick Capture starten</CardTitle>
            <CardDescription>
              Melden Sie sich an, um direkt in Ihr Register zu speichern, oder nutzen Sie den Gastmodus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                router.push("/login?mode=login");
              }}
            >
              Anmelden
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setGuestMode(true);
              }}
            >
              Als Gast fortfahren
            </Button>
            <p className="text-xs text-muted-foreground">
              Im Gastmodus werden Einträge lokal in diesem Browser gespeichert.
            </p>
          </CardContent>
        </Card>
      </SignedInAreaFrame>
    );
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title="Quick Capture"
      description="Erfassen Sie einen neuen KI-Einsatzfall in wenigen Feldern und führen Sie ihn danach im Register weiter."
      nextStep="Dokumentieren Sie zuerst Zweck, Tool und Nutzungskontext."
      width="5xl"
    >
      <QuickCaptureModal
        open={captureOpen}
        onOpenChange={handleModalChange}
        onCaptured={handleCaptured}
        mode={user ? "register" : "guest"}
        renderInline
        initialDraft={initialDraft}
      />
    </SignedInAreaFrame>
  );
}
