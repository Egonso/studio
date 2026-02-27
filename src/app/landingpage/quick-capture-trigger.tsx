"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { QuickCaptureModal } from "@/components/register/quick-capture-modal";

interface QuickCaptureTriggerProps {
  label: string;
  className: string;
}

interface QuickCaptureContextValue {
  openQuickCapture: () => void;
  authLoading: boolean;
}

const quickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

export function QuickCaptureProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const openQuickCapture = () => {
    if (loading) {
      return;
    }

    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um Quick Capture zu verwenden.",
      });
      router.push("/login?mode=login");
      return;
    }

    setOpen(true);
  };

  const handleCaptured = (useCaseId?: string) => {
    if (useCaseId) {
      router.push(`/pass/${useCaseId}`);
      return;
    }
    router.push("/my-register");
  };

  const contextValue: QuickCaptureContextValue = {
    openQuickCapture,
    authLoading: loading,
  };

  return (
    <quickCaptureContext.Provider value={contextValue}>
      {children}
      <QuickCaptureModal
        open={open}
        onOpenChange={setOpen}
        onCaptured={handleCaptured}
      />
    </quickCaptureContext.Provider>
  );
}

export function QuickCaptureTrigger({ label, className }: QuickCaptureTriggerProps) {
  const context = useContext(quickCaptureContext);

  if (!context) {
    throw new Error("QuickCaptureTrigger must be used inside QuickCaptureProvider");
  }

  return (
    <button
      type="button"
      className={className}
      onClick={context.openQuickCapture}
      disabled={context.authLoading}
    >
      {context.authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}
