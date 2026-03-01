
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { GanttChartSquare, Database, LogOut, GraduationCap, PlusCircle, Wand2, BookOpen, Settings, UserCircle, Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { clearActiveProjectId } from "@/lib/data-service";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { WorkspaceSwitcher } from "./layout/workspace-switcher";


export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const brandHomeHref = "/my-register";

  const handleLogout = async () => {
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      await auth.signOut();
      clearActiveProjectId();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b sticky top-0 z-50">
      <Link href={brandHomeHref} className="flex items-center justify-center gap-2" prefetch={false}>
        <Image
          src="/register-logo.png"
          alt="AI Governance Control"
          width={34}
          height={34}
          className="h-7 w-auto"
        />
        <span className="hidden sm:inline-block whitespace-nowrap text-base font-semibold tracking-tight">
          AI Governance Control
        </span>
      </Link>
      {user && (
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <WorkspaceSwitcher />
          {user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) && (
            <Link href="/admin" className="text-sm font-bold text-red-500 hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
              <GanttChartSquare className="h-4 w-4" />
              Admin
            </Link>
          )}
          {profile?.isOfficer && (
            <div className="hidden md:flex items-center gap-1.5 px-2 h-8 text-muted-foreground text-xs font-medium" title="EUKI Certified Officer">
              <ShieldCheck className="h-4 w-4" />
              <span>Certified Officer</span>
            </div>
          )}
          <Link href="/my-register" className="mr-2">
            <Button size="sm" className="h-8 gap-1 px-3" variant="default">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">KI-Anwendung erfassen</span>
            </Button>
          </Link>
          <Link href="/my-register" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <Database className="h-4 w-4" />
            Register
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <GanttChartSquare className="h-4 w-4" />
            Register-Übersicht
          </Link>
          {registerFirstFlags.controlShell && (
            <Link href="/control" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
              <Shield className="h-4 w-4" />
              AI Governance Control
            </Link>
          )}
          <Link href="/cbs" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <Wand2 className="h-4 w-4" />
            Smart Policy Engine
          </Link>
          <Link href="/kurs" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <BookOpen className="h-4 w-4" />
            Kurs
          </Link>
          <Link href="/gesetz" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <BookOpen className="h-4 w-4" />
            Gesetz
          </Link>
          <Link href="/exam" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <GraduationCap className="h-4 w-4" />
            Zertifizierung
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline text-sm max-w-[120px] truncate">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      )}
    </header>
  );
}
