"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/my-register");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Image
            src="/register-logo.png"
            alt="KI-Register"
            width={24}
            height={24}
            className="h-6 w-6 dark:invert"
          />
          <span className="text-sm font-medium">KI-Register</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Anmelden
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-24">
        <div className="max-w-2xl w-full space-y-16">
          {/* Hero */}
          <section className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Jede Organisation mit KI-Einsatzfällen
              <br />
              führt ein KI-Register.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              Ein KI-Register ist die organisationsinterne
              Standard-Struktur zur Dokumentation von KI-Einsatzfällen.
              Es hält Verantwortlichkeiten, Status und Nachweise in
              revisionsfähiger Form fest.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/einrichten"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                KI-Register einrichten
              </Link>
              <Link
                href="/einladen"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Einladungscode verwenden
              </Link>
            </div>
          </section>

          {/* Why necessary */}
          <section className="space-y-5">
            <div className="flex gap-4">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="font-medium text-sm">Verantwortung zuordnen</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Jeder KI-Einsatzfall hat eine zuständige Rolle. Keine
                  Einsatzfälle ohne Eigentümer.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="font-medium text-sm">
                  Status und Prüfstand dokumentieren
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Vom Entwurf bis zur formalen Prüfung — jeder Zustand ist
                  nachvollziehbar.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="font-medium text-sm">
                  Nachweise erzeugen und exportieren
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Use-Case-Pass als PDF und JSON. Standardisiert. Auditfähig.
                  Teilbar.
                </p>
              </div>
            </div>
          </section>

          {/* Trust line */}
          <section className="border-t pt-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              Privat und organisationsintern. Ihre Daten bleiben in Ihrer
              Registerinstanz.
            </p>
            <p className="text-xs text-muted-foreground">
              Output: Use-Case-Pass als PDF und JSON.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>KI-Register ist ein offener Dokumentationsstandard.</span>
          <div className="flex gap-4">
            <a
              href="https://eukigesetz.com/impressum"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Impressum
            </a>
            <a
              href="https://eukigesetz.com/datenschutz"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
