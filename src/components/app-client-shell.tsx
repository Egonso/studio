"use client";

import dynamic from "next/dynamic";

const AuthProvider = dynamic(
  () => import("@/context/auth-context").then((mod) => mod.AuthProvider),
  { ssr: false }
);
const DynamicFavicon = dynamic(
  () => import("@/components/dynamic-favicon").then((mod) => mod.DynamicFavicon),
  { ssr: false }
);
const GlobalChrome = dynamic(
  () => import("@/components/global-chrome").then((mod) => mod.GlobalChrome),
  { ssr: false }
);
const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  { ssr: false }
);

interface AppClientShellProps {
  children: React.ReactNode;
}

export function AppClientShell({ children }: AppClientShellProps) {
  return (
    <AuthProvider>
      <DynamicFavicon />
      {children}
      <Toaster />
      <GlobalChrome />
    </AuthProvider>
  );
}
