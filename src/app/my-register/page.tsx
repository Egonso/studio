"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as string | undefined;

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

  const handleCaptured = useCallback((useCaseId?: string) => {
    setRefreshKey((k) => k + 1);
    if (useCaseId) {
      router.push(`/pass/${useCaseId}`);
    }
  }, [router]);

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
    <div className="min-h-screen p-4 pt-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </div>
        <GovernanceHeader
          useCases={useCases}
          register={activeRegister}
          onQuickCapture={() => setCaptureOpen(true)}
        >
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
          {registers.length === 1 && (
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-auto px-0 hover:bg-transparent"
                onClick={() => setShowWizard(true)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Weiteres Register erstellen
              </Button>
            </div>
          )}
        </GovernanceHeader>
        <RegisterBoard
          mode="standalone"
          refreshKey={refreshKey}
          onUseCasesLoaded={handleUseCasesLoaded}
          initialFilter={initialFilter}
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
