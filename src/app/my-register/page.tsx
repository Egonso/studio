"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Loader2, PlusCircle, Trash2 } from "lucide-react";
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
import { RegisterDeleteDialog } from "@/components/register/register-delete-dialog";
import { GovernanceHeader } from "@/components/register/governance-header";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";
import { CompanyOnboardingWizard } from "@/components/register/company-onboarding-wizard";
import { registerFirstFlags } from "@/lib/register-first/flags";
import {
  registerService,
  type DeleteRegisterResult,
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
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as string | undefined;

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [activeRegister, setActiveRegister] = useState<Register | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [hasChecked, setHasChecked] = useState(false);

  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (!authLoading && user && !hasChecked) {
    setHasChecked(true);
    registerService
      .listRegisters()
      .then(async (regs) => {
        if (regs.length > 0) {
          const selectedRegister =
            (await registerService
              .setActiveRegister(regs[0].registerId)
              .catch(() => regs[0])) ?? regs[0];
          setRegisters(regs);
          setActiveRegister(
            regs.find((register) => register.registerId === selectedRegister.registerId) ??
              selectedRegister
          );
          setOnboardingState("ready");
          // Auto-open QuickCapture after onboarding flow
          if (searchParams.get("onboarding") === "true") {
            setCaptureOpen(true);
          }
        } else {
          // Zero-Friction Onboarding: Auto-create default register
          registerService.createRegister("Meine Organisation").then(reg => {
            return registerService.updateRegisterProfile(reg.registerId, {
              organisationName: "Meine Organisation",
              orgSettings: {
                organisationName: "Meine Organisation",
                industry: "",
                contactPerson: { name: "", email: "" }
              }
            }).then(() => {
              setRegisters([reg]);
              setActiveRegister(reg);
              setOnboardingState("ready");
              setCaptureOpen(true); // Drop right into Quick Capture
            });
          }).catch(err => {
            console.error(err);
            setOnboardingState("no_register");
          });
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
    const selectedRegister = await registerService.setActiveRegister(registerId);
    setRegisters(regs);
    const newReg =
      regs.find((r) => r.registerId === selectedRegister.registerId) ??
      selectedRegister;
    setActiveRegister(newReg);
    setRefreshKey((key) => key + 1);
    setOnboardingState("ready");
    setShowWizard(false);
  };

  const handleSwitchRegister = async (registerId: string) => {
    const selectedRegister = await registerService.setActiveRegister(registerId);
    const reg =
      registers.find((entry) => entry.registerId === selectedRegister.registerId) ??
      selectedRegister;
    setActiveRegister(reg);
    setRefreshKey((k) => k + 1);
  };

  const handleCaptured = (useCaseId?: string) => {
    setRefreshKey((k) => k + 1);
    if (useCaseId) {
      router.push(`/pass/${useCaseId}`);
    }
  };

  const handleUseCasesLoaded = (cards: UseCaseCard[]) => {
    setUseCases(cards);
  };

  const handleRegisterDeleted = async (result: DeleteRegisterResult) => {
    const regs = await registerService.listRegisters();
    const nextActiveRegister =
      regs.find((register) => register.registerId === result.fallbackRegisterId) ??
      regs[0] ??
      null;

    setRegisters(regs);
    setActiveRegister(nextActiveRegister);
    setRefreshKey((key) => key + 1);
  };

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
    <div className="min-h-screen p-4 pt-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <GovernanceHeader
          useCases={useCases}
          register={activeRegister}
          onQuickCapture={() => setCaptureOpen(true)}
        >
          {registers.length > 1 && (
            <div className="flex items-center gap-3">
              <Select
                value={activeRegister?.registerId ?? ""}
                onValueChange={(registerId) => void handleSwitchRegister(registerId)}
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
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Überblick
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWizard(true)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Neues Register
              </Button>
              {registerFirstFlags.registerDeletion && activeRegister && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Register löschen
                </Button>
              )}
            </div>
          )}
          {registers.length === 1 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Überblick
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-auto px-0 hover:bg-transparent"
                onClick={() => setShowWizard(true)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Weiteres Register erstellen
              </Button>
              {registerFirstFlags.registerDeletion && activeRegister && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-auto px-0 text-destructive hover:bg-transparent hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Register löschen
                </Button>
              )}
            </div>
          )}
        </GovernanceHeader>
        <RegisterBoard
          mode="standalone"
          registerId={activeRegister?.registerId}
          refreshKey={refreshKey}
          onUseCasesLoaded={handleUseCasesLoaded}
          initialFilter={initialFilter}
        />
        <RegisterDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          register={activeRegister}
          onDeleted={handleRegisterDeleted}
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
