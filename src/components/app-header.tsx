
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { LogOut, BookOpen, LayoutDashboard, GanttChartSquare, Wand2, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { clearActiveProjectId } from "@/lib/data-service";


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
          src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp"
          alt="AI Act Compass Logo"
          width={40}
          height={40}
          className="h-8 w-auto"
        />
        <span className="font-bold text-lg hidden sm:inline-block">AI Act Compass</span>
      </Link>
      {user && (
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <GanttChartSquare className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/cbs" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <Wand2 className="h-4 w-4" />
            Compliance-in-a-Day
          </Link>
          <Link href="/kurs" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1" prefetch={false}>
            <BookOpen className="h-4 w-4" />
            Kurs
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

