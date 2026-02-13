"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { PlusSquare } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getActiveProjectId } from "@/lib/active-project-client";
import {
  buildCaptureHref,
  isHybridEntryEnabled,
} from "@/lib/register-first/entry-links";
import { registerFirstFlags } from "@/lib/register-first/flags";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  if (target.isContentEditable) {
    return true;
  }

  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function RegisterHybridEntryLauncher() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") ?? getActiveProjectId();

  const captureHref = useMemo(() => buildCaptureHref(projectId), [projectId]);

  const isHybridEnabled = isHybridEntryEnabled(registerFirstFlags);

  useEffect(() => {
    if (!user || !isHybridEnabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcutKey = event.key.toLowerCase() === "k";
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;

      if (!isShortcutKey || !event.shiftKey || !isMetaOrCtrl || event.altKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      router.push(captureHref);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [captureHref, isHybridEnabled, router, user]);

  if (!user || !isHybridEnabled || !registerFirstFlags.stickyLauncher) {
    return null;
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button asChild size="sm" className="shadow-lg">
        <Link href={captureHref}>
          <PlusSquare className="mr-2 h-4 w-4" />
          KI-Capture
          <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
            ctrl/cmd + shift + k
          </span>
        </Link>
      </Button>
    </div>
  );
}
