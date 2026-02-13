"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { CaptureForm } from "@/components/register/capture-form";
import {
  registerService,
  type RegisterServiceErrorCode,
} from "@/lib/register-first/register-service";
import type { UseCaseCard } from "@/lib/register-first/types";

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

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [registerName, setRegisterName] = useState("Mein Register");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lastCreatedCard, setLastCreatedCard] = useState<UseCaseCard | null>(null);

  // Check if user has a register on mount
  const [hasChecked, setHasChecked] = useState(false);

  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (!authLoading && user && !hasChecked) {
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
  }

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

  const handleCaptureSubmit = async (payload: unknown): Promise<UseCaseCard> => {
    const card = await registerService.createUseCaseFromCapture(payload);
    setLastCreatedCard(card);
    return card;
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

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Quick Capture</h1>
        <p className="text-sm text-muted-foreground">
          KI-Einsatzfall in unter 30 Sekunden festhalten.
        </p>
      </div>
      <CaptureForm onSubmit={handleCaptureSubmit} />
      {lastCreatedCard && (
        <div className="mt-6 w-full max-w-3xl">
          <Alert>
            <AlertTitle>Gespeichert</AlertTitle>
            <AlertDescription>
              Use-Case ID: {lastCreatedCard.useCaseId}
              {lastCreatedCard.publicHashId && (
                <>
                  {" "}| Hash: {lastCreatedCard.publicHashId}
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
