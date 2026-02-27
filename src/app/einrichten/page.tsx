"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Backward-compatible redirect: /einrichten → /#einrichten
 * The setup flow now lives inline on the landing page.
 */
export default function EinrichtenRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#einrichten");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
