
'use client';

import { AimsWizard } from "@/components/aims-wizard";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getActiveProjectId } from "@/lib/data-service";

export default function AimsSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (!loading && user && !getActiveProjectId()) {
      router.push('/my-register');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <AimsWizard />
      </div>
    </div>
  );
}

