
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AppHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('assessmentAnswers');
    localStorage.removeItem('companyContext');
    localStorage.removeItem('checklistState');
    localStorage.removeItem('currentTask');
    router.push('/');
  };


  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
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
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          Dashboard
        </Link>
         <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout / Neu starten
         </Button>
      </nav>
    </header>
  );
}
