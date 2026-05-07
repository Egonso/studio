"use client";

import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";

export function PublicLandingLocaleSwitcher() {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/$/, "") ?? "";

  if (normalizedPathname !== "/de" && normalizedPathname !== "/en") {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
      <LocaleSwitcher />
    </div>
  );
}
