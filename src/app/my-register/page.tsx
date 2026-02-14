"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { RegisterBoard } from "@/components/register/register-board";
import { GovernanceHeader } from "@/components/register/governance-header";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
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

export default function MyRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [registerName, setRegisterName] = useState("Mein Register");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleCaptured = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleUseCasesLoaded = useCallback((cards: UseCaseCard[]) => {
    setUseCases(cards);
  }, []);

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
            <CardTitle>AI Governance Register erstellen</CardTitle>
            <CardDescription>
              Ein Register sammelt deine KI-Einsatzfälle. Governance entsteht nur durch menschliche Entscheidungen.
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
                placeholder="z. B. AI Governance Register"
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
    <div className="min-h-screen p-4 pt-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <GovernanceHeader
          useCases={useCases}
          onQuickCapture={() => setCaptureOpen(true)}
        />
        <RegisterBoard
          mode="standalone"
          refreshKey={refreshKey}
          onUseCasesLoaded={handleUseCasesLoaded}
        />
        <QuickCaptureModal
          open={captureOpen}
          onOpenChange={setCaptureOpen}
          onCaptured={handleCaptured}
        />
      </div>
    </div>
  );
}
