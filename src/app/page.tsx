
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { checkOnboardingStatus } from "@/lib/data-service";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      checkOnboardingStatus().then(path => {
        router.push(path);
      });
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Navigieren Sie mit Vertrauen durch den EU AI Act
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AI Act Compass ist Ihr interaktiver Leitfaden, um die Compliance-Anforderungen zu verstehen, Ihre KI-Systeme zu bewerten und die notwendigen Schritte für die Konformität sicherzustellen.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Kostenlos starten <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
              <Image
                src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp"
                width="600"
                height="400"
                alt="AI Act Compass Siegel"
                data-ai-hint="compliance law technology"
                className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-contain sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
