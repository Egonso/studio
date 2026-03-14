"use client";

import dynamic from "next/dynamic";

const AuthProvider = dynamic(
  () => import("@/context/auth-context").then((mod) => mod.AuthProvider),
  { ssr: false }
);

interface AppClientShellProps {
  children: React.ReactNode;
}

export function AppClientShell({ children }: AppClientShellProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
