
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { GanttChartSquare, LayoutDashboard, Database, Scale, KeyRound, LogOut, GraduationCap, Link as LinkIcon, PlusCircle, Wand2, BookOpen } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { clearActiveProjectId } from "@/lib/data-service";
import { ADMIN_EMAILS } from "@/lib/admin-config";


export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();

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
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Image
          src="/logo.png"
          alt="AI Act Compass Logo"
          width={40}
          height={40}
          className="h-8 w-auto"
        />
        <span className="font-bold text-lg hidden sm:inline-block">AI Compliance OS</span>
      </Link>
      {user && (
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          {user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) && (
            <Link href="/admin" className="text-sm font-bold text-red-500 hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
              <GanttChartSquare className="h-4 w-4" />
              Admin
            </Link>
          )}
          <Link href="/my-register" className="mr-2">
            <Button size="sm" className="h-8 gap-1 px-3" variant="default">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">KI-Anwendung erfassen</span>
            </Button>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <GanttChartSquare className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/projects" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <LayoutDashboard className="h-4 w-4" />
            Meine Projekte
          </Link>
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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </nav>
      )}
    </header>
  );
}

