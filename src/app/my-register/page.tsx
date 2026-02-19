"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { RegisterBoard } from "@/components/register/register-board";
import { GovernanceHeader } from "@/components/register/governance-header";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
import { CompanyOnboardingWizard } from "@/components/register/company-onboarding-wizard";
import { AccessCodeManager } from "@/components/register/access-code-manager";
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
  const [captureOpen, setCaptureOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [activeRegister, setActiveRegister] = useState<Register | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWizard, setShowWizard] = useState(false);

  const [hasChecked, setHasChecked] = useState(false);

  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (!authLoading && user && !hasChecked) {
    setHasChecked(true);
    registerService
      .listRegisters()
      .then((regs) => {
        if (regs.length > 0) {
          setRegisters(regs);
          setActiveRegister(regs[0]);
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

  const handleWizardComplete = async (registerId: string) => {
    const regs = await registerService.listRegisters();
    setRegisters(regs);
    const newReg = regs.find((r) => r.registerId === registerId) ?? regs[0];
    setActiveRegister(newReg);
    setOnboardingState("ready");
    setShowWizard(false);
  };

  const handleSwitchRegister = (registerId: string) => {
    const reg = registers.find((r) => r.registerId === registerId);
    if (reg) {
      setActiveRegister(reg);
      setRefreshKey((k) => k + 1);
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

  if (onboardingState === "no_register" || showWizard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <CompanyOnboardingWizard
          onComplete={(registerId) => void handleWizardComplete(registerId)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Register Selector (wenn mehrere Register) */}
        {registers.length > 1 && (
          <div className="flex items-center gap-3">
            <Select
              value={activeRegister?.registerId ?? ""}
              onValueChange={handleSwitchRegister}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Register auswählen" />
              </SelectTrigger>
              <SelectContent>
                {registers.map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.organisationName || r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWizard(true)}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Neues Register
            </Button>
          </div>
        )}

        {/* Neues Register Button (wenn nur ein Register) */}
        {registers.length === 1 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWizard(true)}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Weiteres Register erstellen
            </Button>
          </div>
        )}

        <GovernanceHeader
          useCases={useCases}
          register={activeRegister}
          onQuickCapture={() => setCaptureOpen(true)}
          onRegisterUpdated={(partial) => {
            setActiveRegister((prev) => prev ? { ...prev, ...partial } : prev);
          }}
        />
        <RegisterBoard
          mode="standalone"
          refreshKey={refreshKey}
          onUseCasesLoaded={handleUseCasesLoaded}
        />
        {activeRegister && (
          <AccessCodeManager registerId={activeRegister.registerId} />
        )}
        <QuickCaptureModal
          open={captureOpen}
          onOpenChange={setCaptureOpen}
          onCaptured={handleCaptured}
        />
      </div>
    </div>
  );
}
