
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { getActiveProjectId, setActiveProjectId, getUserProjects } from "@/lib/data-service";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // If a user is logged in, always redirect to the project selection page.
      // This ensures a project context is always established.
      router.push('/my-register');
    } else {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <AppHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center space-y-6"
              >
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Navigieren Sie mit Vertrauen durch den EU AI Act
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AI Act Compass ist Ihr interaktiver Leitfaden, um die Compliance-Anforderungen zu verstehen, Ihre KI-Systeme zu bewerten und die notwendigen Schritte für die Konformität sicherzustellen.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Analyse starten <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-center"
              >
                <Card className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden bg-background">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <Image
                      src="/logo.png"
                      width="200"
                      height="200"
                      alt="AI Act Compass Siegel"
                      data-ai-hint="compliance law technology"
                      className="mx-auto object-contain drop-shadow-lg"
                    />
                    <h3 className="text-2xl font-bold mt-6">Compliance-Ready</h3>
                    <p className="text-muted-foreground mt-2">
                      Vom Status-Check bis zum fertigen Audit-Dossier – alles an einem Ort.
                    </p>
                    <ul className="mt-6 space-y-3 text-left w-full">
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span>Automatisierte Risikoanalyse</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span>KI-gestützte Checklisten</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span>Audit-sicheres Dossier</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

