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
import type { Register, UseCaseCard } from "@/lib/register-first/types";

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
  const [registerName, setRegisterName] = useState("");
  const [isCreatingRegister, setIsCreatingRegister] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [register, setRegister] = useState<Register | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [hasChecked, setHasChecked] = useState(false);

  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (!authLoading && user && !hasChecked) {
    setHasChecked(true);
    registerService
      .getFirstRegister()
      .then((reg) => {
        if (reg) {
          setRegister(reg);
          setOnboardingState("ready");
        } else {
          setOnboardingState("no_register");
        }
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
    setIsCreatingRegister(true);
    setCreateError(null);

    try {
      const orgName = registerName.trim() || null;
      const displayName = orgName ?? "AI Governance Register";
      const reg = await registerService.createRegister(displayName);

      // Store org name if provided
      if (orgName) {
        await registerService.updateRegisterProfile(reg.registerId, {
          organisationName: orgName,
        });
        reg.organisationName = orgName;
      }

      setRegister(reg);
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
              <Label htmlFor="registerName">Organisationseinheit (optional)</Label>
              <Input
                id="registerName"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="z. B. Müller GmbH"
              />
            </div>
            <Button
              onClick={() => void handleCreateRegister()}
              disabled={isCreatingRegister}
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
          register={register}
          onQuickCapture={() => setCaptureOpen(true)}
          onRegisterUpdated={(partial) => {
            setRegister((prev) => prev ? { ...prev, ...partial } : prev);
          }}
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
