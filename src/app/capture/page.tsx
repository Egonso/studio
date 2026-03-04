"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
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
  const source = searchParams.get("source");
  const prefill = (searchParams.get("prefill") ?? "").trim();
  const originUrl = (searchParams.get("originUrl") ?? "").trim();
  const [captureOpen, setCaptureOpen] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [registerName, setRegisterName] = useState("Mein Register");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
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
          router.push("/login");
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
    router.push(guestMode ? "/simplelanding" : "/my-register");
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
      router.push(`/pass/${useCaseId}`);
      return;
    }
    closeCapture();
  };

  if (authLoading || onboardingState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (onboardingState === "no_register") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erstelle dein erstes Register</CardTitle>
            <CardDescription>
              Ein Register sammelt deine KI-Einsatzfaelle. Du kannst spaeter weitere anlegen.
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
    );
  }

  if (!user && !guestMode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quick Capture starten</CardTitle>
            <CardDescription>
              Melde dich an, um direkt in dein Register zu speichern, oder nutze den Gastmodus.
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
      </div>
    );
  }

  return (
    <QuickCaptureModal
      open={captureOpen}
      onOpenChange={handleModalChange}
      onCaptured={handleCaptured}
      mode={user ? "register" : "guest"}
      renderInline
      initialDraft={initialDraft}
    />
  );
}
